import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { generateBlock, injectBlock, generateAllTargets, getTargets } from '../src/generators/guidelines.js'
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const START_MARKER = '<!-- @geniova/git-hooks:start -->'
const END_MARKER = '<!-- @geniova/git-hooks:end -->'

describe('guidelines generator', () => {
  describe('generateBlock', () => {
    it('genera un bloque con marcadores de inicio y fin', () => {
      const block = generateBlock()
      expect(block).toContain(START_MARKER)
      expect(block).toContain(END_MARKER)
    })

    it('incluye el header de guidelines', () => {
      const block = generateBlock()
      expect(block).toContain('# Geniova Development Guidelines')
    })

    it('incluye todas las guidelines estables', () => {
      const block = generateBlock()
      expect(block).toContain('# Guías de Estilo de Código')
      expect(block).toContain('# Naming Conventions')
      expect(block).toContain('# Error Handling')
      expect(block).toContain('# Estándares de Testing')
      expect(block).toContain('# Guías de Seguridad')
      expect(block).toContain('# Guías de UI/UX')
      expect(block).toContain('# Commits y Pull Requests')
      expect(block).toContain('# Gestión de Dependencias')
      expect(block).toContain('# Implementation Plan')
      expect(block).toContain('# Protección contra Sobreescrituras Accidentales')
      expect(block).toContain('# Firebase / Firestore Patterns')
      expect(block).toContain('# Astro + Lit Patterns')
      expect(block).toContain('# Git & Firebase Identity')
    })

    it('incluye la sección de guidelines dinámicas', () => {
      const block = generateBlock()
      expect(block).toContain('# Guidelines dinámicas (Planning Game MCP)')
      expect(block).toContain('get_global_config')
      expect(block).toContain('get_project(projectId)')
      expect(block).toContain('list_adrs(projectId)')
    })

    it('incluye la nota de autogenerado', () => {
      const block = generateBlock()
      expect(block).toContain('AUTOGENERADO por @geniova/git-hooks')
      expect(block).toContain('npx @geniova/git-hooks generate')
    })
  })

  describe('injectBlock', () => {
    it('genera contenido nuevo si no hay existente', () => {
      const result = injectBlock('')
      expect(result).toContain(START_MARKER)
      expect(result).toContain('# Geniova Development Guidelines')
    })

    it('genera contenido nuevo si existingContent es null-ish', () => {
      const result = injectBlock('')
      expect(result.startsWith(START_MARKER)).toBe(true)
    })

    it('añade al final si CLAUDE.md existe sin marcadores', () => {
      const existing = '# Mi Proyecto\n\nInstrucciones custom del proyecto.'
      const result = injectBlock(existing)
      expect(result).toContain('# Mi Proyecto')
      expect(result).toContain('Instrucciones custom del proyecto.')
      expect(result).toContain(START_MARKER)
      // El contenido original va primero
      expect(result.indexOf('# Mi Proyecto')).toBeLessThan(result.indexOf(START_MARKER))
    })

    it('reemplaza la sección si ya existen marcadores', () => {
      const existing = `# Mi Proyecto

Instrucciones custom.

${START_MARKER}
<!-- contenido viejo -->
${END_MARKER}

# Más instrucciones custom`

      const result = injectBlock(existing)
      expect(result).toContain('# Mi Proyecto')
      expect(result).toContain('Instrucciones custom.')
      expect(result).toContain('# Más instrucciones custom')
      expect(result).not.toContain('contenido viejo')
      expect(result).toContain('# Geniova Development Guidelines')
    })

    it('preserva contenido antes y después de los marcadores', () => {
      const before = '# Antes\n\nTexto antes.\n\n'
      const after = '\n\n# Después\n\nTexto después.'
      const existing = `${before}${START_MARKER}\nold\n${END_MARKER}${after}`

      const result = injectBlock(existing)
      expect(result).toContain('# Antes')
      expect(result).toContain('Texto antes.')
      expect(result).toContain('# Después')
      expect(result).toContain('Texto después.')
    })

    it('el bloque inyectado mantiene los marcadores', () => {
      const result = injectBlock('# Proyecto')
      const startCount = (result.match(new RegExp(START_MARKER, 'g')) || []).length
      const endCount = (result.match(new RegExp(END_MARKER, 'g')) || []).length
      expect(startCount).toBe(1)
      expect(endCount).toBe(1)
    })
  })

  describe('generateAllTargets', () => {
    const tmpDir = join(import.meta.dirname, '__tmp_targets__')

    beforeEach(() => {
      mkdirSync(tmpDir, { recursive: true })
    })

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true })
    })

    it('genera ficheros para todos los targets', () => {
      const results = generateAllTargets(tmpDir)
      const targets = getTargets()
      expect(results).toHaveLength(targets.length)

      for (const r of results) {
        expect(r.created).toBe(true)
        const filePath = join(tmpDir, r.file)
        expect(existsSync(filePath)).toBe(true)
        const content = readFileSync(filePath, 'utf-8')
        expect(content).toContain(START_MARKER)
        expect(content).toContain('# Geniova Development Guidelines')
      }
    })

    it('genera CLAUDE.md, AGENTS.md, copilot-instructions.md, styleguide.md, .cursorrules', () => {
      generateAllTargets(tmpDir)
      expect(existsSync(join(tmpDir, 'CLAUDE.md'))).toBe(true)
      expect(existsSync(join(tmpDir, 'AGENTS.md'))).toBe(true)
      expect(existsSync(join(tmpDir, '.github', 'copilot-instructions.md'))).toBe(true)
      expect(existsSync(join(tmpDir, '.gemini', 'styleguide.md'))).toBe(true)
      expect(existsSync(join(tmpDir, '.cursorrules'))).toBe(true)
    })

    it('actualiza sin perder contenido custom al regenerar', () => {
      // Primera generación
      generateAllTargets(tmpDir)

      // Simular contenido custom añadido por el usuario en CLAUDE.md
      const claudePath = join(tmpDir, 'CLAUDE.md')
      const original = readFileSync(claudePath, 'utf-8')
      const withCustom = '# Custom del proyecto\n\nMis instrucciones.\n\n' + original
      writeFileSync(claudePath, withCustom)

      // Regenerar
      const results = generateAllTargets(tmpDir)
      const claudeResult = results.find((r) => r.file === 'CLAUDE.md')
      expect(claudeResult.created).toBe(false)

      const updated = readFileSync(claudePath, 'utf-8')
      expect(updated).toContain('# Custom del proyecto')
      expect(updated).toContain('Mis instrucciones.')
      expect(updated).toContain('# Geniova Development Guidelines')
    })

    it('crea subdirectorios si no existen', () => {
      generateAllTargets(tmpDir)
      expect(existsSync(join(tmpDir, '.github'))).toBe(true)
      expect(existsSync(join(tmpDir, '.gemini'))).toBe(true)
    })
  })
})
