/** ANSI color codes */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

/**
 * Logger utility with colored output using native ANSI codes.
 * Zero dependencies.
 */
export const logger = {
  /**
   * Log a success message in green.
   * @param {string} msg
   */
  success(msg) {
    console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`);
  },

  /**
   * Log an error message in red.
   * @param {string} msg
   */
  error(msg) {
    console.error(`${COLORS.red}✗${COLORS.reset} ${msg}`);
  },

  /**
   * Log a warning message in yellow.
   * @param {string} msg
   */
  warn(msg) {
    console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`);
  },

  /**
   * Log an info message in cyan.
   * @param {string} msg
   */
  info(msg) {
    console.log(`${COLORS.cyan}${msg}${COLORS.reset}`);
  },

  /**
   * Log a step progress message.
   * @param {number} current - Current step number
   * @param {number} total - Total number of steps
   * @param {string} msg - Step description
   */
  step(current, total, msg) {
    console.log(
      `${COLORS.bold}${COLORS.blue}[${current}/${total}]${COLORS.reset} ${msg}`
    );
  },
};
