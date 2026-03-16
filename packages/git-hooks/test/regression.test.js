import { describe, it, expect, vi } from 'vitest'
import { runRegressionCheck } from '../src/checks/regression.js'

// Mock git.js para evitar llamadas reales a git
vi.mock('../src/utils/git.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getFileHistory: vi.fn(),
  }
})

import { getFileHistory } from '../src/utils/git.js'

function makeDiff(file, removed, added) {
  const removes = removed.map((l) => `-${l}`).join('\n')
  const adds = added.map((l) => `+${l}`).join('\n')
  return `diff --git a/${file} b/${file}
--- a/${file}
+++ b/${file}
@@ -1,${removed.length} +1,${added.length} @@
${removes}
${adds}`
}

function makeHistory(entries) {
  return entries
    .map(
      (e) => `commit ${e.hash}
Author: Dev <dev@geniova.com>
Date:   ${e.date}

    ${e.message}

diff --git a/file b/file
--- a/file
+++ b/file
@@ -0,0 +1 @@
+${e.line}`
    )
    .join('\n\n')
}

describe('regression check', () => {
  it('detecta regresión cuando una línea del historial es revertida', async () => {
    const diff = makeDiff(
      'src/styles/global.css',
      ['  --primary-color: #df006e;'],
      ['  --primary-color: #1a73e8;']
    )

    getFileHistory.mockReturnValue(
      makeHistory([
        {
          hash: 'abc1234567890',
          date: '2026-02-15',
          message: 'fix: update corporate colors to magenta',
          line: '  --primary-color: #df006e;',
        },
      ])
    )

    const result = await runRegressionCheck(diff)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0].actual).toContain('#df006e')
    expect(result.warnings[0].staged).toContain('#1a73e8')
  })

  it('no genera warning para archivos nuevos (solo adds)', async () => {
    const diff = `diff --git a/src/new-file.js b/src/new-file.js
--- /dev/null
+++ b/src/new-file.js
@@ -0,0 +1,2 @@
+const x = 1
+const y = 2`

    const result = await runRegressionCheck(diff)
    expect(result.warnings).toHaveLength(0)
  })

  it('no genera warning para archivos eliminados (solo removes)', async () => {
    const diff = `diff --git a/src/old-file.js b/src/old-file.js
--- a/src/old-file.js
+++ /dev/null
@@ -1,2 +0,0 @@
-const x = 1
-const y = 2`

    const result = await runRegressionCheck(diff)
    expect(result.warnings).toHaveLength(0)
  })

  it('omite archivos excluidos (node_modules, dist)', async () => {
    const diff = makeDiff(
      'node_modules/pkg/index.js',
      ['old line'],
      ['new line']
    )

    const result = await runRegressionCheck(diff)
    expect(result.warnings).toHaveLength(0)
  })

  it('omite archivos no soportados (.md, .txt)', async () => {
    const diff = makeDiff('README.md', ['old text'], ['new text'])

    const result = await runRegressionCheck(diff)
    expect(result.warnings).toHaveLength(0)
  })

  it('omite check si hay más de maxFiles archivos', async () => {
    // Generar diff con 25 archivos
    const files = Array.from({ length: 25 }, (_, i) =>
      makeDiff(`src/file${i}.js`, ['old'], ['new'])
    )

    const result = await runRegressionCheck(files.join('\n'), { maxFiles: 20 })
    expect(result.warnings).toHaveLength(0)
  })

  it('no genera warning si el historial está vacío', async () => {
    const diff = makeDiff('src/app.js', ['const x = 1'], ['const x = 2'])
    getFileHistory.mockReturnValue('')

    const result = await runRegressionCheck(diff)
    expect(result.warnings).toHaveLength(0)
  })

  it('normalización CSS es case-insensitive', async () => {
    const diff = makeDiff(
      'src/styles.css',
      ['  COLOR: #DF006E;'],
      ['  color: #1a73e8;']
    )

    getFileHistory.mockReturnValue(
      makeHistory([
        {
          hash: 'def4567890123',
          date: '2026-01-10',
          message: 'style: add colors',
          line: '  color: #DF006E;',
        },
      ])
    )

    const result = await runRegressionCheck(diff)
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})
