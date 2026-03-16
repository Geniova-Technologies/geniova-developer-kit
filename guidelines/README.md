# Guidelines de Desarrollo — Geniova Technologies

## Estrategia híbrida

Las guidelines de Geniova se gestionan con un modelo híbrido:

### Estables (este directorio) — versionadas en git
Estándares que cambian poco y requieren revisión antes de modificarse:

| Fichero | Contenido |
|---------|-----------|
| [code-style.md](code-style.md) | Principios SOLID/DRY/KISS/YAGNI, convenciones JS/TS, sobre-ingeniería |
| [naming-conventions.md](naming-conventions.md) | Ficheros, variables, CSS, Firebase, idioma |
| [error-handling.md](error-handling.md) | Fallar explícitamente, boundaries, logging de errores |
| [testing.md](testing.md) | TDD, tipos de tests, coverage mínimo, convenciones |
| [security.md](security.md) | Validación, datos sensibles, Firebase, dependencias |
| [ui-ux.md](ui-ux.md) | Modales, feedback, accesibilidad, responsive |
| [commits-and-prs.md](commits-and-prs.md) | Conventional commits, PRs pequeñas, ramas, despliegue |
| [dependencies.md](dependencies.md) | Cuándo añadir deps, evaluación, versionado, actualización |
| [implementation-plan.md](implementation-plan.md) | Cuándo y cómo rellenar el plan de implementación |
| [file-protection.md](file-protection.md) | Protección contra sobreescrituras accidentales |
| [firebase-patterns.md](firebase-patterns.md) | Colecciones, security rules, Cloud Functions, transacciones |
| [astro-lit-patterns.md](astro-lit-patterns.md) | Estructura de proyecto, componentes Lit, comunicación, estilos |
| [git-firebase-identity.md](git-firebase-identity.md) | Verificación de identidad git/Firebase antes de push/deploy |

### Dinámicas (Planning Game MCP) — consultadas en runtime
Contenido que evoluciona con frecuencia o depende del contexto del proyecto:

| Tipo | Ejemplos | Cómo acceder |
|------|----------|--------------|
| `instructions` (planning) | Workflow obligatorio con Planning Game | `get_global_config('instructions', id)` |
| `prompts` | Code review, estimación, criterios de aceptación, análisis de bugs | `get_global_config('prompts', id)` |
| `agents` | BecarIA Developer, BecarIA Code Reviewer | `get_global_config('agents', id)` |
| Project-specific | agentsGuidelines, ADRs | `get_project(id)`, `list_adrs(id)` |

## Uso

### Para agentes (Claude Code, BecarIA, etc.)
El comando `geniova-hooks init` copia las guidelines estables al proyecto como parte del `CLAUDE.md` generado. Las dinámicas se consultan vía Planning Game MCP al inicio de cada sesión.

### Para desarrolladores
Leer este directorio como referencia. Los cambios a estas guidelines se hacen mediante PR al repo `geniova-git-hooks`.
