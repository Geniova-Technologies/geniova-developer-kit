/**
 * Logger con colores ANSI — sin dependencias externas.
 */

const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const DIM = '\x1b[2m'

export const logger = {
  info(msg) {
    console.log(`${CYAN}ℹ${RESET} ${msg}`)
  },

  success(msg) {
    console.log(`${GREEN}✓${RESET} ${msg}`)
  },

  warn(msg) {
    console.log(`${YELLOW}⚠${RESET} ${msg}`)
  },

  error(msg) {
    console.error(`${RED}✖${RESET} ${msg}`)
  },

  heading(msg) {
    console.log(`\n${BOLD}${msg}${RESET}`)
  },

  dim(msg) {
    console.log(`${DIM}  ${msg}${RESET}`)
  },

  detail(label, value) {
    console.log(`  ${DIM}${label}:${RESET} ${value}`)
  },

  blank() {
    console.log('')
  },
}
