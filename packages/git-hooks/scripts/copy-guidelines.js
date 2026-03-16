/**
 * Prepack script: copies guidelines from monorepo root into the package
 * so that `npm pack` / `pnpm pack` includes them in the tarball.
 */

import { cpSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const packageDir = import.meta.dirname ? join(import.meta.dirname, '..') : process.cwd()
const monorepoGuidelines = join(packageDir, '..', '..', 'guidelines')
const localGuidelines = join(packageDir, 'guidelines')

if (existsSync(monorepoGuidelines)) {
  cpSync(monorepoGuidelines, localGuidelines, { recursive: true })
  console.log('✓ Guidelines copied from monorepo root to package')
} else {
  console.warn('⚠ Monorepo guidelines/ not found — package may be missing guidelines')
}
