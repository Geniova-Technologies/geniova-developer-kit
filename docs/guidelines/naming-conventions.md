# Naming Conventions

## Ficheros y directorios

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Ficheros JS/TS generales | `kebab-case` | `config-resolver.js`, `run-checks.js` |
| Componentes Web (Lit) | `kebab-case` con prefijo de app | `app-modal.js`, `slide-notification.js` |
| Ficheros de test | `nombre-original.test.js` | `no-ai-refs.test.js` |
| Ficheros de configuración | `kebab-case` | `eslint-default.js`, `vitest.config.js` |
| Directorios | `kebab-case` | `src/checks/`, `src/utils/` |
| Assets (imágenes, SVG) | `kebab-case` | `logo-geniova.svg` |

## JavaScript / TypeScript

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Variables y funciones | `camelCase` | `getStagedFiles`, `commitMessage` |
| Constantes | `UPPER_SNAKE_CASE` | `AI_PATTERNS`, `DEFAULT_CONFIG` |
| Clases | `PascalCase` | `ModalService`, `TreatmentManager` |
| Componentes Lit (tag) | `kebab-case` con prefijo | `<app-modal>`, `<slide-notification>` |
| Componentes Lit (clase) | `PascalCase` | `AppModal`, `SlideNotification` |
| Propiedades booleanas | Prefijo `is`/`has`/`should` | `isAuthenticated`, `hasPermission` |
| Event handlers | Prefijo `handle` o `on` | `handleClick`, `onSubmit` |
| Funciones async | Verbo descriptivo | `fetchUser`, `loadTreatments` |

## CSS

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Custom properties | `--prefijo-nombre` | `--app-primary-color`, `--modal-width` |
| Clases | `kebab-case` | `.card-header`, `.treatment-list` |
| Clases de estado | Prefijo `is-` | `.is-active`, `.is-loading` |
| Clases de layout | Prefijo `l-` | `.l-sidebar`, `.l-main` |

## Firebase / Firestore

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Colecciones | `camelCase` plural | `users`, `treatments`, `notificationPreferences` |
| Documentos | ID generado por Firestore o `kebab-case` si es manual | `auto-id`, `config-general` |
| Campos | `camelCase` | `createdAt`, `businessPoints`, `firstName` |
| Cloud Functions | `camelCase` con prefijo de trigger | `onUserCreated`, `httpsCreateTreatment` |

## Idioma

- Código (variables, funciones, clases, campos): **inglés**
- Comentarios: inglés o español según el proyecto (consistente dentro del proyecto)
- Mensajes de UI al usuario: **español** (o el idioma del mercado)
- Logs: **inglés**
