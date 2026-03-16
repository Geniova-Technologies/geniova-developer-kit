import { createInterface } from 'node:readline';

/**
 * Creates a readline interface for interactive prompts.
 * @returns {import('node:readline').Interface}
 */
function createRL() {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompts the user to select an option from a numbered list.
 * @param {Array<{label: string, value: *}>} options - List of options
 * @param {string} [message='Selecciona una opcion'] - Prompt message
 * @returns {Promise<*>} The selected option's value
 */
export async function select(options, message = 'Selecciona una opcion') {
  const rl = createRL();

  console.log('');
  options.forEach((opt, i) => {
    console.log(`  ${i + 1}) ${opt.label}`);
  });
  console.log('');

  return new Promise((resolve) => {
    const ask = () => {
      rl.question(`${message} [1-${options.length}]: `, (answer) => {
        const num = parseInt(answer, 10);
        if (num >= 1 && num <= options.length) {
          rl.close();
          resolve(options[num - 1].value);
        } else {
          console.log('  Opcion no valida. Intenta de nuevo.');
          ask();
        }
      });
    };
    ask();
  });
}

/**
 * Prompts the user for a yes/no confirmation.
 * @param {string} message - The question to ask
 * @param {boolean} [defaultValue=true] - Default value if user presses Enter
 * @returns {Promise<boolean>}
 */
export async function confirm(message, defaultValue = true) {
  const rl = createRL();
  const hint = defaultValue ? '[Y/n]' : '[y/N]';

  return new Promise((resolve) => {
    rl.question(`${message} ${hint}: `, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === '') {
        resolve(defaultValue);
      } else {
        resolve(trimmed === 'y' || trimmed === 'yes' || trimmed === 'si');
      }
    });
  });
}

/**
 * Prompts the user for text input.
 * @param {string} message - The prompt message
 * @param {string} [defaultValue=''] - Default value if user presses Enter
 * @returns {Promise<string>}
 */
export async function input(message, defaultValue = '') {
  const rl = createRL();
  const hint = defaultValue ? ` (${defaultValue})` : '';

  return new Promise((resolve) => {
    rl.question(`${message}${hint}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}
