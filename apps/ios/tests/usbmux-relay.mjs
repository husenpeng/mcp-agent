//
//  usbmux-relay.mjs
//  USB transport for the phone-use acceptance.
//
//  Forwards a Mac loopback port to a TCP port on the attached iPhone through
//  usbmuxd, so the Host reaches the runner without a VPN and without the
//  Local Network permission iOS never grants a UI-test runner.
//
//  Usage: node apps/ios/tests/usbmux-relay.mjs <localPort> <devicePort>
//  Example: node apps/ios/tests/usbmux-relay.mjs 18200 8200
//           curl http://127.0.0.1:18200/health
//
//  One usbmux session per client connection: the HTTP runner closes each
//  connection after one response, and a shared session would die with it.
// usbmuxd port relay: Mac 127.0.0.1:<local> -> device:<remote>, one session per
// client connection. Speaks the usbmuxd plist protocol, so it needs no
// libimobiledevice install and no VPN.
import { createConnection, createServer } from 'node:net'

const [, , localPort, remotePort] = process.argv
const SOCK = '/var/run/usbmuxd'

const plist = (entries) => {
  const body = Object.entries(entries)
    .map(([k, v]) => `<key>${k}</key>${typeof v === 'number' ? `<integer>${v}</integer>` : `<string>${v}</string>`}`)
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict>${body}</dict></plist>`
}

const frame = (xml) => {
  const payload = Buffer.from(xml, 'utf8')
  const header = Buffer.alloc(16)
  header.writeUInt32LE(16 + payload.length, 0)
  header.writeUInt32LE(1, 4)
  header.writeUInt32LE(8, 8)
  header.writeUInt32LE(1, 12)
  return Buffer.concat([header, payload])
}

const readMessage = (socket) => new Promise((resolve, reject) => {
  let buffer = Buffer.alloc(0)
  const onData = (chunk) => {
    buffer = Buffer.concat([buffer, chunk])
    if (buffer.length < 16) return
    const total = buffer.readUInt32LE(0)
    if (buffer.length < total) return
    socket.off('data', onData)
    resolve(buffer.subarray(16, total).toString('utf8'))
  }
  socket.on('data', onData)
  socket.once('error', reject)
})

const number = (xml, key) => {
  const match = new RegExp(`<key>${key}</key>\\s*<integer>(\\d+)</integer>`).exec(xml)
  return match ? Number(match[1]) : undefined
}

async function deviceId() {
  const socket = createConnection(SOCK)
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('error', reject) })
  socket.write(frame(plist({ MessageType: 'ListDevices', ClientVersionString: 'usb-relay', ProgName: 'usb-relay', kLibUSBMuxVersion: 3 })))
  const reply = await readMessage(socket)
  socket.end()
  return number(reply, 'DeviceID')
}

async function openSession(id, port) {
  const socket = createConnection(SOCK)
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('error', reject) })
  const swapped = ((Number(port) & 0xff) << 8) | ((Number(port) >> 8) & 0xff)
  socket.write(frame(plist({
    MessageType: 'Connect', ClientVersionString: 'usb-relay', ProgName: 'usb-relay', kLibUSBMuxVersion: 3,
    DeviceID: id, PortNumber: swapped,
  })))
  const reply = await readMessage(socket)
  const result = number(reply, 'Number') ?? number(reply, 'Result')
  if (result !== 0) {
    socket.destroy()
    throw new Error(`usbmuxd connect refused (${result})`)
  }
  return socket
}

const id = await deviceId()
if (id === undefined) { console.error('no device attached'); process.exit(1) }

createServer(async (client) => {
  try {
    const session = await openSession(id, remotePort)
    client.pipe(session)
    session.pipe(client)
    const close = () => { client.destroy(); session.destroy() }
    client.on('error', close)
    session.on('error', close)
    client.on('close', close)
    session.on('close', close)
  } catch (error) {
    console.error('session failed:', error.message)
    client.destroy()
  }
}).listen(Number(localPort), '127.0.0.1', () => console.log(`relay 127.0.0.1:${localPort} -> device:${remotePort} (device ${id})`))
