/**
 * Compact summary of Geniova development guidelines for CLAUDE.md.
 * Full content lives in .ai/guidelines/ — agents read there when they need detail.
 *
 * Target: < 8K chars total (leaves room for project-specific content within 40K limit)
 */

export const GUIDELINES_SUMMARY = `# Geniova Development Guidelines (resumen)

> Detalle completo en \`.ai/guidelines/\`. Consultar el fichero específico cuando necesites profundizar.

## Code Style (.ai/guidelines/code-style.md)
- Principios: SOLID, DRY, KISS, YAGNI
- JS vanilla + JSDoc por defecto (TypeScript solo si el proyecto ya lo usa)
- \`const\` por defecto, \`let\` solo cuando sea necesario
- Sin fallbacks silenciosos: el sistema funciona o falla
- Cadenas \`||\` para datos críticos PROHIBIDO
- No sobre-ingeniar: no añadir features, abstracciones ni handling para escenarios imposibles

## Naming (.ai/guidelines/naming-conventions.md)
- Ficheros: \`kebab-case\` | Variables/funciones: \`camelCase\` | Constantes: \`UPPER_SNAKE_CASE\` | Clases: \`PascalCase\`
- Componentes Lit tag: \`kebab-case\` con prefijo (\`<app-modal>\`) | clase: \`PascalCase\`
- Firestore colecciones: \`camelCase\` plural | campos: \`camelCase\`
- Código en inglés, UI en español, logs en inglés

## Error Handling (.ai/guidelines/error-handling.md)
- Fallar explícitamente, nunca en silencio. \`catch\` vacíos prohibidos
- Funciones internas: dejar que falle. Boundaries (UI, endpoint): capturar y comunicar
- Validar entrada temprano con mensajes descriptivos
- No loguear passwords, tokens ni datos personales

## Testing (.ai/guidelines/testing.md)
- Test-first obligatorio: verificar/crear tests ANTES de modificar código
- Vitest (unit/integration), Playwright (E2E)
- Coverage: servicios 80%, utilidades 90%, componentes 70%
- Si fallan tests, ARREGLAR antes de continuar

## Security (.ai/guidelines/security.md)
- Validar entrada del usuario, sanitizar datos (XSS), parameterized queries
- NUNCA commitear credenciales, API keys, secrets
- \`serviceAccountKey.json\` NUNCA en git
- Firebase: reglas de seguridad, validar permisos en Cloud Functions, no exponer Admin SDK en cliente

## UI/UX (.ai/guidelines/ui-ux.md)
- NUNCA usar \`alert()\`, \`confirm()\`, \`prompt()\` nativos — usar sistema de modales de la app
- Loading/spinner en operaciones async, notificaciones toast para feedback
- Mobile-first, responsive, accesible (labels, contraste, teclado)

## Commits y PRs (.ai/guidelines/commits-and-prs.md)
- Conventional Commits: \`feat:\`, \`fix:\`, \`refactor:\`, \`docs:\`, \`test:\`, \`chore:\`
- NUNCA referencias a IA en commits
- Max ~300 líneas por PR (ideal < 200), PRs atómicas
- NUNCA push directo a main — todo por PR

## Dependencies (.ai/guidelines/dependencies.md)
- Añadir solo si no se resuelve en <50 líneas. Verificar mantenimiento, tamaño, licencia
- \`package-lock.json\` SIEMPRE en git. \`npm audit\` regularmente

## Implementation Plan (.ai/guidelines/implementation-plan.md)
- Rellenar ANTES de implementar si devPoints >= 3, afecta >2 ficheros, o hay múltiples enfoques
- Incluir: approach, steps (1 paso = 1 commit), dataModelChanges, apiChanges, risks, outOfScope

## File Protection (.ai/guidelines/file-protection.md)
- NUNCA sobreescribir archivos existentes sin leer primero el contenido actual
- Usar Edit (no Write) para modificar ficheros existentes

## Astro + Lit Patterns (.ai/guidelines/astro-lit-patterns.md)
- Astro: páginas y contenido estático (zero JS). Lit: componentes interactivos (Web Components)
- Evaluar SSG vs SPA vs View Transitions al inicio del proyecto
- Lit: \`static properties\` (sin decoradores), eventos con \`composed: true\`, estilos en \`static styles\`
- Comunicación: padre→hijo por propiedades, hijo→padre por CustomEvent

## Firebase Patterns (.ai/guidelines/firebase-patterns.md)
- Modelar Firestore para las queries, no para la forma de los datos
- Campos estándar: \`createdAt\`, \`createdBy\`, \`updatedAt\`, \`updatedBy\`
- Security rules: denegar por defecto, abrir explícitamente
- Cloud Functions: idempotentes, un fichero por dominio, Admin SDK solo server-side
- Entornos con \`.env.dev\`, \`.env.pre\`, \`.env.prod\` — \`.env\` generado, en \`.gitignore\`

## Git & Firebase Identity (.ai/guidelines/git-firebase-identity.md)
- SSH obligatorio para remotos git, NUNCA HTTPS
- Verificar \`git config user.email\` antes de push (debe ser cuenta Geniova)
- Firebase: SIEMPRE usar \`--account usuario@geniova.com\`, NUNCA \`firebase login:use\`
`
