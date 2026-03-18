/**
 * Generates a CLAUDE.md for a project based on Planning Game data.
 *
 * @param {Object} project - Project data from PG (get_project response)
 * @param {Object[]} [adrs] - ADRs from PG (list_adrs response)
 * @returns {string} CLAUDE.md content
 */
export function generateClaudeMd(project, adrs = []) {
  const sections = [];

  // ── Header ──
  sections.push(`# ${project.name} (${project.abbreviation})`);

  // ── Context ──
  if (project.description) {
    sections.push(`## Contexto\n\n${project.description}`);
  }

  // ── Stack ──
  const stackLines = [];
  if (project.languages?.length) {
    stackLines.push(`- **Lenguajes**: ${project.languages.join(', ')}`);
  }
  if (project.frameworks?.length) {
    stackLines.push(`- **Frameworks**: ${project.frameworks.join(', ')}`);
  }
  if (stackLines.length) {
    sections.push(`## Stack\n\n${stackLines.join('\n')}`);
  }

  // ── Repos ──
  const repoSection = formatRepos(project.repoUrl);
  if (repoSection) {
    sections.push(`## Repositorios\n\n${repoSection}`);
  }

  // ── Team ──
  const teamLines = [];
  const devs = (project.developers || []).filter(d => d.name && d.id);
  const stks = (project.stakeholders || []).filter(s => s.name && s.id);
  if (devs.length) {
    teamLines.push('### Developers\n');
    for (const d of devs) {
      teamLines.push(`- ${d.name} (\`${d.id}\`)`);
    }
  }
  if (stks.length) {
    teamLines.push('\n### Stakeholders\n');
    for (const s of stks) {
      teamLines.push(`- ${s.name} (\`${s.id}\`)`);
    }
  }
  if (teamLines.length) {
    sections.push(`## Equipo\n\n${teamLines.join('\n')}`);
  }

  // ── Project-specific guidelines ──
  if (project.agentsGuidelines) {
    sections.push(`## Guidelines del proyecto\n\n${project.agentsGuidelines}`);
  } else {
    sections.push(
      '## Guidelines del proyecto\n\n' +
      '<!-- Sin guidelines especificas aun. Enriquece esta seccion via PR. -->\n' +
      '<!-- Incluye: archivos criticos, reglas especificas, workflow particular, restricciones -->'
    );
  }

  // ── ADRs ──
  const acceptedAdrs = adrs.filter(a => a.status === 'accepted');
  if (acceptedAdrs.length) {
    const adrLines = acceptedAdrs.map(a => `- **${a.cardId}**: ${a.title}`);
    sections.push(
      '## ADRs vigentes\n\n' +
      adrLines.join('\n') + '\n\n' +
      'Consultar detalle con `get_adr(projectId, adrId)` via Planning Game MCP.'
    );
  }

  // ── Scoring ──
  if (project.scoringSystem) {
    sections.push(`## Sistema de puntuacion\n\n${project.scoringSystem === 'fibonacci' ? 'Fibonacci (1, 2, 3, 5, 8, 13, 21)' : 'Escala 1-5'}`);
  }

  // ── Footer: placeholder for git-hooks auto-generated block ──
  sections.push(
    '---\n\n' +
    '<!-- Las guidelines comunes de desarrollo de Geniova se inyectan automaticamente -->\n' +
    '<!-- debajo de esta linea al ejecutar: npx @geniova/git-hooks generate -->'
  );

  return sections.join('\n\n') + '\n';
}

/**
 * Format repo URLs for display.
 * @param {string|Object[]|null} repoUrl
 * @returns {string|null}
 */
function formatRepos(repoUrl) {
  if (!repoUrl) return null;

  if (typeof repoUrl === 'string') {
    return `- ${repoUrl}`;
  }

  if (Array.isArray(repoUrl)) {
    return repoUrl
      .map(r => `- **${r.label}**: ${r.url}`)
      .join('\n');
  }

  return null;
}
