import { describe, it, expect } from 'vitest'
import { runNoAiRefsCheck } from '../src/checks/no-ai-refs.js'

function makeDiff(file, addedLines) {
  const adds = addedLines.map((l) => `+${l}`).join('\n')
  return `diff --git a/${file} b/${file}
--- a/${file}
+++ b/${file}
@@ -1,0 +1,${addedLines.length} @@
${adds}`
}

describe('no-ai-refs check', () => {
  it('detecta "Claude" en una línea añadida', () => {
    const diff = makeDiff('src/index.js', ['// Fixed by Claude'])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(false)
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].file).toBe('src/index.js')
  })

  it('detecta "GPT-4" en una línea añadida', () => {
    const diff = makeDiff('src/utils.js', ['// Generated with GPT-4'])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(false)
    expect(result.matches).toHaveLength(1)
  })

  it('detecta "ChatGPT"', () => {
    const diff = makeDiff('readme.txt', ['ChatGPT helped write this'])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(false)
  })

  it('detecta "Copilot"', () => {
    const diff = makeDiff('app.js', ['// Copilot suggestion'])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(false)
  })

  it('detecta "Anthropic"', () => {
    const diff = makeDiff('src/main.js', ['// Powered by Anthropic'])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(false)
  })

  it('detecta "AI-generated"', () => {
    const diff = makeDiff('src/component.js', ['// AI-generated code below'])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(false)
  })

  it('detecta Co-Authored-By con Claude', () => {
    const diff = makeDiff('src/foo.js', ['Co-Authored-By: Claude <noreply@anthropic.com>'])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(false)
  })

  it('detecta "Gemini"', () => {
    const diff = makeDiff('src/bar.js', ['// Gemini suggestion'])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(false)
  })

  it('detecta "DeepSeek"', () => {
    const diff = makeDiff('src/baz.js', ['// DeepSeek generated'])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(false)
  })

  it('pasa si no hay referencias a IA', () => {
    const diff = makeDiff('src/clean.js', [
      'const x = 42',
      'function hello() { return "world" }',
    ])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(true)
    expect(result.matches).toHaveLength(0)
  })

  it('excluye CLAUDE.md', () => {
    const diff = makeDiff('CLAUDE.md', ['Claude is great for coding'])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(true)
  })

  it('excluye archivos en .claude/', () => {
    const diff = makeDiff('.claude/settings.json', ['Claude config here'])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(true)
  })

  it('excluye package-lock.json', () => {
    const diff = makeDiff('package-lock.json', ['"Anthropic": "1.0.0"'])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(true)
  })

  it('soporta allowInFiles extra', () => {
    const diff = makeDiff('docs/ai-tools.md', ['We use Claude for reviews'])
    const result = runNoAiRefsCheck(diff, { allowInFiles: ['docs/'] })
    expect(result.passed).toBe(true)
  })

  it('soporta extraPatterns', () => {
    const diff = makeDiff('src/index.js', ['// MyCustomAI did this'])
    const result = runNoAiRefsCheck(diff, {
      extraPatterns: [/MyCustomAI/i],
    })
    expect(result.passed).toBe(false)
  })

  it('no detecta falsos positivos en palabras similares', () => {
    const diff = makeDiff('src/app.js', [
      'const claudeVariable = true', // minúscula al principio → Claude matchea por \b
    ])
    // "claudeVariable" no debería matchear porque Claude busca \bClaude\b
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(true)
  })

  it('detecta múltiples matches en el mismo archivo', () => {
    const diff = makeDiff('src/multi.js', [
      '// Claude did this',
      '// GPT-4 also helped',
    ])
    const result = runNoAiRefsCheck(diff)
    expect(result.passed).toBe(false)
    expect(result.matches).toHaveLength(2)
  })
})
