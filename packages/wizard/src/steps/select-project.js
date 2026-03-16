import { PROJECTS } from '../catalog/projects.js';
import { select } from '../utils/prompt.js';

/**
 * Displays an interactive list of Geniova projects and lets the user select one.
 * @returns {Promise<import('../catalog/projects.js').Project | null>}
 */
export async function selectProject() {
  const options = PROJECTS.map((project) => ({
    label: `${project.name} (${project.abbreviation}) - ${project.description}`,
    value: project,
  }));

  return select(options, 'Selecciona el proyecto');
}
