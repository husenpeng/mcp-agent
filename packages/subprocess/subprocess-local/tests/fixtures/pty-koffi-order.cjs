// Load koffi before node-pty so koffi's exception-free node-addon-api callback
// wrapper wins weak-symbol coalescing, then trigger a node-pty native throw.
// pty.node built with hidden visibility keeps its own catching wrapper and
// reports the throw as a JS error; a coalesced prebuild wrapper aborts instead.
require(process.argv[2])
const pty = require(process.argv[3])
try {
  // PtyOpen rejects missing arguments before any syscall, so the throw is
  // deterministic regardless of whether the host can allocate a PTY.
  pty.native.open()
  process.stdout.write('NO_THROW\n')
  process.exit(3)
} catch (error) {
  process.stdout.write(`CAUGHT:${error.message}\n`)
  process.exit(0)
}