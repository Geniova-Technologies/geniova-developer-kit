import { describe, it, expect, vi, beforeEach } from 'vitest'

let writeFileCalls = []
let execSyncCalls = []

vi.mock('node:fs', async () => {
  const actual = await vi.importActual('node:fs')
  return {
    ...actual,
    readFileSync: vi.fn((path) => {
      return readFileMockData[path] ?? ''
    }),
    writeFileSync: vi.fn((path, content) => {
      writeFileCalls.push({ path, content })
    }),
  }
})

vi.mock('node:child_process', () => ({
  execSync: vi.fn((cmd) => {
    execSyncCalls.push(cmd)
    return ''
  }),
}))

let readFileMockData = {}

const { runStripComments } = await import('../src/checks/strip-comments.js')

beforeEach(() => {
  writeFileCalls = []
  execSyncCalls = []
  readFileMockData = {}
})

describe('strip-comments check', () => {
  it('elimina comentarios // descriptivos simples', () => {
    readFileMockData['src/index.js'] = [
      'const x = 1',
      '// Load data',
      'const y = 2',
      '// Attach handlers',
      'const z = 3',
    ].join('\n')

    const result = runStripComments(['src/index.js'])

    expect(result.totalRemoved).toBe(2)
    expect(result.strippedFiles).toEqual(['src/index.js'])
    expect(writeFileCalls[0].content).not.toContain('// Load data')
    expect(writeFileCalls[0].content).not.toContain('// Attach handlers')
    expect(writeFileCalls[0].content).toContain('const x = 1')
    expect(writeFileCalls[0].content).toContain('const y = 2')
  })

  it('mantiene comentarios TODO, FIXME, HACK, NOTE, XXX, WARN', () => {
    readFileMockData['src/utils.js'] = [
      '// TODO: implement caching',
      '// FIXME: race condition here',
      '// HACK: temporary workaround',
      '// NOTE: this is intentional',
      '// XXX: needs review',
      '// WARN: deprecated API',
      'const x = 1',
    ].join('\n')

    const result = runStripComments(['src/utils.js'])

    expect(result.totalRemoved).toBe(0)
    expect(writeFileCalls).toHaveLength(0)
  })

  it('mantiene JSDoc completos (/** ... */)', () => {
    readFileMockData['src/api.js'] = [
      '/**',
      ' * Loads user data from the API.',
      ' * @param {string} userId',
      ' * @returns {Promise<User>}',
      ' */',
      'async function loadUser(userId) {',
      '  return fetch(userId)',
      '}',
    ].join('\n')

    const result = runStripComments(['src/api.js'])

    expect(result.totalRemoved).toBe(0)
  })

  it('mantiene directivas eslint, prettier, ts-ignore', () => {
    readFileMockData['src/config.ts'] = [
      '// eslint-disable-next-line no-console',
      'console.log("debug")',
      '// @ts-ignore',
      'const x: any = 1',
      '// prettier-ignore',
      'const y = {a:1,b:2}',
      '// noqa: E501',
      'const z = "long line"',
    ].join('\n')

    const result = runStripComments(['src/config.ts'])

    expect(result.totalRemoved).toBe(0)
  })

  it('mantiene comentarios con URLs', () => {
    readFileMockData['src/fetch.js'] = [
      '// See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API',
      '// Reference: http://example.com/docs',
      'const response = await fetch(url)',
    ].join('\n')

    const result = runStripComments(['src/fetch.js'])

    expect(result.totalRemoved).toBe(0)
  })

  it('mantiene comentarios con @type, @typedef, @property, @enum', () => {
    readFileMockData['src/types.js'] = [
      '// @type {import("./types").Config}',
      '// @typedef {Object} UserConfig',
      '// @property {string} name',
      '// @enum {string}',
      'const config = {}',
    ].join('\n')

    const result = runStripComments(['src/types.js'])

    expect(result.totalRemoved).toBe(0)
  })

  it('ignora archivos no JS/TS/Astro', () => {
    readFileMockData['README.md'] = '// This is markdown\n'

    const result = runStripComments(['README.md'])

    expect(result.totalRemoved).toBe(0)
    expect(writeFileCalls).toHaveLength(0)
  })

  it('ignora archivos en node_modules', () => {
    readFileMockData['node_modules/lib/index.js'] = '// Load stuff\nconst x = 1'

    const result = runStripComments(['node_modules/lib/index.js'])

    expect(result.totalRemoved).toBe(0)
  })

  it('re-stagea ficheros modificados con git add', () => {
    readFileMockData['src/app.js'] = '// Initialize app\nconst app = express()'

    runStripComments(['src/app.js'])

    expect(execSyncCalls).toContain('git add "src/app.js"')
  })

  it('soporta ficheros .astro', () => {
    readFileMockData['src/Page.astro'] = [
      '---',
      '// Fetch data from API',
      'const data = await fetch(url)',
      '---',
      '<div>{data}</div>',
    ].join('\n')

    const result = runStripComments(['src/Page.astro'])

    expect(result.totalRemoved).toBe(1)
    expect(writeFileCalls[0].content).toContain('const data = await fetch(url)')
    expect(writeFileCalls[0].content).not.toContain('// Fetch data from API')
  })

  it('devuelve resultado vacio si no hay ficheros staged', () => {
    const result = runStripComments([])

    expect(result.totalRemoved).toBe(0)
    expect(result.strippedFiles).toEqual([])
  })

  it('no modifica ficheros sin comentarios strippable', () => {
    readFileMockData['src/clean.js'] = 'const x = 1\nconst y = 2\n'

    const result = runStripComments(['src/clean.js'])

    expect(result.totalRemoved).toBe(0)
    expect(writeFileCalls).toHaveLength(0)
  })

  it('mantiene lineas dentro de bloques JSDoc incluso si empiezan con //', () => {
    readFileMockData['src/doc.js'] = [
      '/**',
      ' * Main function.',
      ' * // this is inside jsdoc',
      ' */',
      'function main() {}',
    ].join('\n')

    const result = runStripComments(['src/doc.js'])

    expect(result.totalRemoved).toBe(0)
  })
})
