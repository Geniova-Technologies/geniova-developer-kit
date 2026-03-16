import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { z } from 'zod'
import { generateAllTargets, generateBlock, getTargets } from '../generators/guidelines.js'

const PACKAGE_GUIDELINES = join(import.meta.dirname, '..', '..', 'guidelines')
const MONOREPO_GUIDELINES = join(import.meta.dirname, '..', '..', '..', '..', 'guidelines')
const GUIDELINES_DIR = existsSync(MONOREPO_GUIDELINES) ? MONOREPO_GUIDELINES : PACKAGE_GUIDELINES

export function createServer() {
  const server = new McpServer({
    name: '@geniova/git-hooks',
    version: '1.0.0',
  })

  // --- Tools ---

  server.tool(
    'init_project',
    'Initializes a Geniova project: installs husky hooks (pre-commit, commit-msg, pre-push) and generates guideline files for all AI agents (Claude, Copilot, Codex, Gemini, Cursor).',
    {
      cwd: z.string().describe('Absolute path to the project root directory'),
    },
    async ({ cwd }) => {
      try {
        execSync(`node ${join(import.meta.dirname, '..', '..', 'bin', 'cli.js')} init`, {
          cwd,
          encoding: 'utf-8',
          stdio: 'pipe',
        })
        return { content: [{ type: 'text', text: `Project initialized successfully at ${cwd}` }] }
      } catch (err) {
        return { content: [{ type: 'text', text: `Error initializing project: ${err.stdout || err.message}` }], isError: true }
      }
    }
  )

  server.tool(
    'generate_guidelines',
    'Regenerates guideline files for all AI agents in the target project. Preserves custom content outside the managed markers.',
    {
      cwd: z.string().describe('Absolute path to the project root directory'),
    },
    async ({ cwd }) => {
      try {
        const results = generateAllTargets(cwd)
        const summary = results.map((r) =>
          `${r.created ? 'Created' : 'Updated'}: ${r.file} (${r.target})`
        ).join('\n')
        return { content: [{ type: 'text', text: summary }] }
      } catch (err) {
        return { content: [{ type: 'text', text: `Error generating guidelines: ${err.message}` }], isError: true }
      }
    }
  )

  server.tool(
    'list_guidelines',
    'Lists all available development guidelines with their filenames and descriptions.',
    {},
    async () => {
      const files = readdirSync(GUIDELINES_DIR).filter((f) => f !== 'README.md' && f.endsWith('.md'))
      const list = files.map((f) => {
        const content = readFileSync(join(GUIDELINES_DIR, f), 'utf-8')
        const firstLine = content.split('\n').find((l) => l.startsWith('# '))
        const title = firstLine ? firstLine.replace('# ', '') : f
        return `- **${f}**: ${title}`
      }).join('\n')
      return { content: [{ type: 'text', text: list }] }
    }
  )

  server.tool(
    'get_guideline',
    'Returns the full content of a specific development guideline.',
    {
      name: z.string().describe('Guideline filename (e.g. "code-style.md", "testing.md")'),
    },
    async ({ name }) => {
      const filePath = join(GUIDELINES_DIR, name)
      if (!existsSync(filePath)) {
        const available = readdirSync(GUIDELINES_DIR).filter((f) => f.endsWith('.md') && f !== 'README.md')
        return {
          content: [{ type: 'text', text: `Guideline "${name}" not found. Available: ${available.join(', ')}` }],
          isError: true,
        }
      }
      const content = readFileSync(filePath, 'utf-8')
      return { content: [{ type: 'text', text: content }] }
    }
  )

  server.tool(
    'get_full_guidelines',
    'Returns the complete generated guidelines block (all guidelines concatenated with dynamic guidelines reference).',
    {},
    async () => {
      const block = generateBlock()
      return { content: [{ type: 'text', text: block }] }
    }
  )

  server.tool(
    'list_targets',
    'Lists all AI agent targets supported for guideline generation.',
    {},
    async () => {
      const targets = getTargets()
      const list = targets.map((t) => `- **${t.name}**: \`${t.file}\``).join('\n')
      return { content: [{ type: 'text', text: list }] }
    }
  )

  server.tool(
    'get_project_config',
    'Returns the .githooksrc.json configuration of a project, or the defaults if no config file exists.',
    {
      cwd: z.string().describe('Absolute path to the project root directory'),
    },
    async ({ cwd }) => {
      const configPath = join(cwd, '.githooksrc.json')
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf-8')
        return { content: [{ type: 'text', text: content }] }
      }
      return { content: [{ type: 'text', text: 'No .githooksrc.json found. Using defaults.' }] }
    }
  )

  return server
}
