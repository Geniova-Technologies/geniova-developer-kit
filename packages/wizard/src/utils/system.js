import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir, platform } from 'node:os';

/**
 * Check if a command is available in PATH.
 * @param {string} cmd
 * @returns {boolean}
 */
export function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a command executes successfully (exit code 0).
 * @param {string} cmd
 * @returns {boolean}
 */
export function execSucceeds(cmd) {
  try {
    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Run a command interactively (inherits stdio for password prompts, user input, etc.).
 * @param {string} cmd
 * @returns {boolean} true if the command exited with code 0
 */
export function runInteractive(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Run a command with explicit args (avoids shell injection).
 * @param {string} cmd - The executable
 * @param {string[]} args - Arguments array
 * @returns {boolean} true if the command exited with code 0
 */
export function runWithArgs(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  return result.status === 0;
}

/**
 * Get command output silently. Returns null on failure.
 * @param {string} cmd
 * @returns {string | null}
 */
export function getOutput(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Detect the current OS.
 * @returns {'linux' | 'macos' | 'other'}
 */
export function getOS() {
  const os = platform();
  if (os === 'darwin') return 'macos';
  if (os === 'linux') return 'linux';
  return 'other';
}

/**
 * Find SSH public key files in ~/.ssh
 * @returns {string[]} List of .pub filenames
 */
export function findSSHKeys() {
  const sshDir = resolve(homedir(), '.ssh');
  if (!existsSync(sshDir)) return [];
  try {
    return readdirSync(sshDir).filter((f) => f.endsWith('.pub'));
  } catch {
    return [];
  }
}
