# Geniova Developer Kit

Toolkit para configurar el entorno de desarrollo de Geniova Technologies.

## Instalacion rapida

```bash
npx @geniova/developer-kit init
```

El wizard configura automaticamente:

1. **Prerequisites** — node, git, gh, pnpm, firebase (instala lo que falte)
2. **MCPs** — Planning Game, Karajan, Chrome DevTools, SonarQube
3. **Plugins** — frontend-design, impeccable, code-review, security-guidance, etc.
4. **Workspace** — directorio comun con CLAUDE.md y `.ai/guidelines/` para todos los proyectos
5. **Proyectos** (opcional) — clona, instala deps, configura hooks y genera ficheros de config

## Arquitectura

```
npx @geniova/developer-kit init          (npm publico — wrapper)
  └─ npx @geniova-technologies/geniova-kit  (GitHub Packages — privado)
       └─ npx @geniova/git-hooks init          (npm publico)
```

## Monorepo

| Paquete | Directorio | Registry |
|---------|------------|----------|
| `@geniova/developer-kit` | `packages/developer-kit/` | npm (publico) |
| `@geniova-technologies/geniova-kit` | `packages/wizard/` | GitHub Packages (privado) |
| `@geniova/git-hooks` | `packages/git-hooks/` | npm (publico) |

## Prompt para IA

Si prefieres que una IA configure todo por ti, copia y pega esto en Claude Code:

```
Configura mi entorno de desarrollo para Geniova Technologies:
1. Verifica que tengo instalado: node >= 18, git, gh (GitHub CLI), pnpm, firebase-tools y claude
2. Si falta algo, instalalo (Linux: apt/npm, macOS: brew/npm)
3. Autentica gh con SSH y scope read:packages. Configura ~/.npmrc para @geniova-technologies en GitHub Packages
4. Ejecuta: npx @geniova/developer-kit init — y responde a las preguntas del wizard
5. Si el wizard falla, diagnostica el error y reintenta
```

## Documentacion

- [Landing](https://devkit.geniova.com) — vision general
- [Onboarding](https://devkit.geniova.com/onboarding.html) — guia paso a paso
- [PR Workflow](https://devkit.geniova.com/pr-workflow.html) — flujo de PRs con BecarIA
- [Referencia](https://devkit.geniova.com/reference.html) — hooks, checks, guidelines
