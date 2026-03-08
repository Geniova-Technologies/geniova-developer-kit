const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

export function success(msg) {
  console.log(`  ${GREEN}\u2714${RESET} ${msg}`);
}

export function error(msg) {
  console.log(`  ${RED}\u2718${RESET} ${msg}`);
}

export function warn(msg) {
  console.log(`  ${YELLOW}\u26A0${RESET} ${msg}`);
}

export function info(msg) {
  console.log(`  ${CYAN}i${RESET} ${msg}`);
}

export function banner() {
  console.log();
  console.log(`  ${BOLD}${CYAN}Geniova Developer Kit${RESET} ${DIM}v0.1.0${RESET}`);
  console.log(`  ${DIM}Bootstrapper para el entorno de desarrollo${RESET}`);
  console.log();
}
