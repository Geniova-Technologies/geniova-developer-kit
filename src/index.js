import { banner } from './utils/logger.js';
import { checkPrerequisites } from './checks/prerequisites.js';
import { checkAuth } from './checks/auth.js';
import { launchWizard } from './launcher/wizard.js';

export async function main() {
  try {
    banner();
    checkPrerequisites();
    checkAuth();
    await launchWizard();
  } catch (err) {
    if (err.code === 'EXIT') {
      process.exit(1);
    }
    console.error(err);
    process.exit(1);
  }
}
