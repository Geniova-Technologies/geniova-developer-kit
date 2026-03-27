# Geniova Developer Kit - Project Rules

## Arquitectura de paquetes

```
npx @geniova/developer-kit init          (npmjs.com - público)
  └─ npx @geniova-technologies/geniova-kit  (GitHub Packages - privado)
       └─ npx @geniova/git-hooks init          (npmjs.com - público)
```

### Regla fundamental: el paquete público es un wrapper

`@geniova/developer-kit` (npm público) es **cartón-piedra**:
- Solo verifica node >= 18 y gh CLI
- Solo comprueba GitHub auth
- Configura el registry y lanza el paquete privado
- **NUNCA debe contener lógica, catálogos, configuraciones o referencias internas de Geniova**
- Todo lo específico va en `@geniova-technologies/geniova-kit` (privado)

### Paquete privado: wizard

`@geniova-technologies/geniova-kit` (GitHub Packages) contiene toda la lógica:
- Prerequisites completos (firebase, claude, karajan)
- Catálogo de proyectos
- Configuración de MCPs
- Git hooks y guidelines
- Branch protection
- Review rules

## Monorepo

- `packages/developer-kit/` → `@geniova/developer-kit` (npm público)
- `packages/wizard/` → `@geniova-technologies/geniova-kit` (GitHub Packages privado)
- `packages/git-hooks/` → `@geniova/git-hooks` (npm público)

## Publicación

Antes de publicar, asegurarse de que el código fuente del monorepo está sincronizado con lo que se va a publicar. El monorepo es la fuente de verdad.

## Documentación / Landing

- La web **devkit.geniova.com** está alojada en **GitHub Pages** desde el directorio `docs/` de este repo (rama `main`)
- El repo es **público** — necesario para GitHub Pages gratis y para que `npx @geniova/developer-kit` funcione desde npm público
- CNAME configurado en `docs/CNAME`
- Páginas: `index.html`, `onboarding.html`, `pr-workflow.html`, `reference.html`
- Al modificar la documentación, los cambios se publican automáticamente al mergear a `main`

## MCPs en el wizard

- Antes de instalar un MCP, comprobar si ya está configurado (`claude mcp list`)
- Si `claude mcp add` dice "already exists", tratar como éxito
- Al pedir rutas al usuario, aceptar tanto la ruta al directorio como la ruta completa al fichero
