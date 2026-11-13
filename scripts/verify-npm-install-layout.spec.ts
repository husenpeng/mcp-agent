import { describe, expect, it } from 'vitest'
import type { NpmPackageLock, RegistryIndex } from './benchmark-npm-resolution.ts'
import {
  assertDualTomatoInstallLayout,
  assertResolutionWorkBudget,
  buildDualTomatoRegistry,
  MAX_RESOLUTION_WORK_UNITS,
} from './verify-npm-install-layout.ts'

function validLayout(): NpmPackageLock {
  return {
    lockfileVersion: 3,
    packages: {
      '': { dependencies: { '@tomato/cli': '0.2.0', 'tomato-previous': 'npm:@tomato/cli@0.1.0' } },
      'node_modules/@tomato/cordis': { version: '4.0.1' },
      'node_modules/@tomato/cli': {
        version: '0.2.0',
        dependencies: { '@tomato/child': '^0.2.0' },
        peerDependencies: { '@tomato/cordis': '^4.0.1' },
      },
      'node_modules/@tomato/child': {
        version: '0.2.0',
        dependencies: { '@tomato/leaf': '^0.2.0' },
      },
      'node_modules/@tomato/leaf': { version: '0.2.0' },
      'node_modules/tomato-previous': {
        name: '@tomato/cli',
        version: '0.1.0',
        dependencies: { '@tomato/child': '^0.1.0' },
        peerDependencies: { '@tomato/cordis': '^4.0.1' },
      },
      'node_modules/tomato-previous/node_modules/@tomato/child': {
        version: '0.1.0',
        dependencies: { '@tomato/leaf': '^0.1.0' },
      },
      'node_modules/tomato-previous/node_modules/@tomato/leaf': { version: '0.1.0' },
    },
  }
}

describe('npm install layout verifier', () => {
  it('creates two incompatible versions of every TOMATO package', () => {
    const index: RegistryIndex = new Map([
      ['@tomato/cli', new Map([['0.1.1-rc.2', {
        name: '@tomato/cli',
        version: '0.1.1-rc.2',
        dependencies: { '@tomato/child': '^0.1.1-rc.2' },
        peerDependencies: { '@tomato/cordis': '^4.0.1' },
      }]])],
      ['@tomato/child', new Map([['0.1.1-rc.2', {
        name: '@tomato/child',
        version: '0.1.1-rc.2',
      }]])],
      ['@tomato/cordis', new Map([['4.0.1', {
        name: '@tomato/cordis',
        version: '4.0.1',
      }]])],
    ])

    const dual = buildDualTomatoRegistry(index, '0.1.1-rc.2')

    expect([...dual.get('@tomato/cli')?.keys() ?? []]).toEqual(['0.1.0', '0.2.0'])
    expect(dual.get('@tomato/cli')?.get('0.1.0')).toMatchObject({
      version: '0.1.0',
      dependencies: { '@tomato/child': '^0.1.0' },
      peerDependencies: { '@tomato/cordis': '^4.0.1' },
    })
    expect(dual.get('@tomato/cli')?.get('0.2.0')).toMatchObject({
      version: '0.2.0',
      dependencies: { '@tomato/child': '^0.2.0' },
    })
    expect(dual.get('@tomato/cordis')).toBe(index.get('@tomato/cordis'))
  })

  it('accepts isolated TOMATO releases with one shared Cordis installation', () => {
    expect(assertDualTomatoInstallLayout(validLayout())).toEqual({
      tomatoPackagesPerVersion: 3,
      checkedTomatoEdges: 4,
    })
  })

  it.each([
    ['react', 'node_modules/react'],
    ['react-dom', 'node_modules/react-dom'],
    ['react', 'node_modules/tomato-previous/node_modules/react'],
    ['react-dom', 'node_modules/tomato-previous/node_modules/react-dom'],
  ])('rejects browser runtime %s installed at %s in the TOMATO-only consumer', (name, path) => {
    const layout = validLayout()
    const packages = { ...layout.packages, [path]: { version: '18.3.1' } }
    expect(() => assertDualTomatoInstallLayout({ ...layout, packages })).toThrow(
      `${path}: ${name} is a browser build input`,
    )
  })

  it('rejects an internal edge that crosses release versions', () => {
    const layout = validLayout()
    const packages = { ...layout.packages }
    Reflect.deleteProperty(packages, 'node_modules/tomato-previous/node_modules/@tomato/leaf')

    expect(() => assertDualTomatoInstallLayout({ ...layout, packages })).toThrow(
      'node_modules/tomato-previous/node_modules/@tomato/child: dependencies '
      + '@tomato/leaf resolves to node_modules/@tomato/leaf@0.2.0, expected 0.1.0',
    )
  })

  it('rejects a second Cordis installation', () => {
    const layout = validLayout()
    const packages = {
      ...layout.packages,
      'node_modules/tomato-previous/node_modules/@tomato/cordis': { version: '4.0.1' },
    }

    expect(() => assertDualTomatoInstallLayout({ ...layout, packages })).toThrow(
      'expected one shared @tomato/cordis',
    )
  })
})

describe('resolution work budget', () => {
  it.each([
    [277, 2524, 699_148],
    [316, 2780, 878_480],
    [316, 2786, 880_376],
    [317, 2786, 883_162],
    [320, 2836, 907_520],
  ])('accepts the measured dual-release graph with %i packages and %i edges', (packages, edges, units) => {
    expect(assertResolutionWorkBudget({ tomatoPackagesPerVersion: packages, checkedTomatoEdges: edges }))
      .toBe(units)
  })

  it('accepts a graph exactly at the budget and rejects one internal edge above it', () => {
    const packages = 320
    const edgesAtBudget = Math.floor(MAX_RESOLUTION_WORK_UNITS / packages)

    expect(packages * edgesAtBudget).toBe(MAX_RESOLUTION_WORK_UNITS)
    expect(assertResolutionWorkBudget({ tomatoPackagesPerVersion: packages, checkedTomatoEdges: edgesAtBudget }))
      .toBe(MAX_RESOLUTION_WORK_UNITS)
    expect(() => assertResolutionWorkBudget({
      tomatoPackagesPerVersion: packages,
      checkedTomatoEdges: edgesAtBudget + 1,
    })).toThrow(`= ${String(MAX_RESOLUTION_WORK_UNITS + packages)} unit(s), budget ${String(MAX_RESOLUTION_WORK_UNITS)} unit(s)`)
  })

  it('accepts the headroom and rejects a runaway graph with its own measured counts', () => {
    expect(assertResolutionWorkBudget({ tomatoPackagesPerVersion: 350, checkedTomatoEdges: 3200 }))
      .toBe(1_120_000)
    expect(() => assertResolutionWorkBudget({ tomatoPackagesPerVersion: 400, checkedTomatoEdges: 3000 }))
      .toThrow(`400 package(s) per release x 3000 internal edge(s) = 1200000 unit(s), budget ${String(MAX_RESOLUTION_WORK_UNITS)} unit(s)`)
  })
})
