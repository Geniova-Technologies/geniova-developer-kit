# Astro + Lit Patterns

Stack dominante en Geniova: Astro como framework de páginas, Lit para componentes web interactivos.

## SSG vs SPA: evaluar antes de empezar

No todas las apps deben ser SSG ni todas deben ser SPA. Evaluar qué modelo encaja mejor con el caso de uso.

| Criterio | SSG (Static Site Generation) | SPA (Single Page Application) |
|----------|------------------------------|-------------------------------|
| Contenido | Mayoritariamente estático, cambia poco | Altamente dinámico, cambia con cada interacción |
| Autenticación | No requerida o en pocas páginas | Toda la app requiere login |
| Navegación | Páginas independientes, poco estado compartido | Flujos complejos con estado que persiste entre vistas |
| SEO | Importante | No relevante (app interna) |
| Rendimiento inicial | Carga instantánea (HTML pre-renderizado) | Carga inicial más pesada (JS bundle) |
| Ejemplo Geniova | Web corporativa, Portal de links | Extranet, Intranet, PlanningGame |

### Recomendación
- **SSG** (Astro output `'static'`): webs públicas, landing pages, documentación, portales de links. Astro genera HTML estático en build time — máximo rendimiento, mínimo JS.
- **SSG + View Transitions**: Muchos casos que parecen necesitar SPA realmente solo necesitan transiciones fluidas entre páginas. Astro View Transitions ofrece navegación sin recarga completa (animaciones, persistencia de elementos, swap de contenido) manteniendo las ventajas de SSG. Evaluar esta opción ANTES de decidir que necesitas una SPA.
- **SPA** (Astro output `'server'` o `'hybrid'`, o SPA pura): solo cuando hay estado complejo que persiste entre muchas vistas, flujos multi-paso con datos temporales, o interactividad en tiempo real continua. Apps internas con autenticación no implican SPA automáticamente.
- **Híbrido** (Astro `'hybrid'`): páginas públicas estáticas + secciones privadas dinámicas en la misma app.

### View Transitions de Astro
```astro
---
// src/layouts/Layout.astro
import { ViewTransitions } from 'astro:transitions'
---
<html>
  <head>
    <ViewTransitions />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- Añadir `<ViewTransitions />` en el layout para habilitar navegación sin recarga
- Usar `transition:name` para animar elementos entre páginas
- Usar `transition:persist` para mantener componentes con estado (ej: reproductor de audio, sidebar)
- Se puede activar por página o globalmente — no es todo o nada

La decisión se toma al inicio del proyecto y se documenta en un ADR si no es obvia.

## Astro

### Estructura de proyecto
```
src/
├── pages/          — Rutas (file-based routing)
├── layouts/        — Layouts compartidos
├── components/     — Componentes Astro (.astro) y Lit (.js)
├── shared/
│   ├── scripts/    — JS compartido (servicios, utils)
│   ├── styles/     — CSS compartido
│   └── utils/      — Utilidades puras
├── assets/         — Imágenes, fuentes (procesados por Astro)
└── public/         — Assets estáticos (copiados tal cual)
```

### Convenciones Astro
- Páginas en `src/pages/` — cada fichero `.astro` es una ruta
- Componentes Astro para contenido estático o con poca interactividad
- Componentes Lit (Web Components) para interactividad rica del lado del cliente
- Los componentes Astro NO se envían al cliente — zero JS por defecto
- Usar `client:load`, `client:visible`, `client:idle` para hidratar componentes interactivos

### Cuándo usar Astro vs Lit
| Caso | Usar |
|------|------|
| Página estática, layout, header/footer | Astro component (`.astro`) |
| Formulario interactivo, modal, tabla con filtros | Lit component (`.js`) |
| Contenido que cambia con datos del servidor | Astro component |
| Widget reutilizable entre proyectos | Lit component |

## Lit (Web Components)

### Estructura de un componente
```javascript
import { LitElement, html, css } from 'lit'

export class AppModal extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    title: { type: String },
  }

  static styles = css`
    :host {
      display: block;
    }
    :host([open]) .overlay {
      display: flex;
    }
  `

  constructor() {
    super()
    this.open = false
    this.title = ''
  }

  render() {
    return html`
      <div class="overlay">
        <div class="modal">
          <h2>${this.title}</h2>
          <slot></slot>
        </div>
      </div>
    `
  }
}

customElements.define('app-modal', AppModal)
```

### Convenciones Lit

#### Propiedades
- Usar `static properties` (no decoradores) para compatibilidad sin build step
- `reflect: true` solo si el atributo HTML debe reflejar el estado
- Inicializar SIEMPRE en el constructor

#### Eventos
- Disparar eventos custom para comunicación hijo → padre
- Usar `CustomEvent` con `bubbles: true, composed: true` para cruzar Shadow DOM
```javascript
this.dispatchEvent(new CustomEvent('item-selected', {
  detail: { id: this.selectedId },
  bubbles: true,
  composed: true,
}))
```

#### Slots
- Usar `<slot>` para composición de contenido
- Slots nombrados para múltiples puntos de inserción: `<slot name="header">`
- Preferir slots sobre propiedades para contenido HTML complejo

#### Estilos
- Estilos SIEMPRE en `static styles` — encapsulados por Shadow DOM
- Usar CSS custom properties (`--var`) para permitir personalización desde fuera
- NO usar `!important`
- Estilar `:host` para dimensiones y display del componente

#### Ciclo de vida
- `connectedCallback()` — setup (listeners globales, fetch inicial)
- `disconnectedCallback()` — cleanup (remove listeners, abort controllers)
- `updated()` — reaccionar a cambios de propiedades
- `firstUpdated()` — acceso al DOM tras primer render (querySelector, focus)

### Comunicación entre componentes

| Dirección | Mecanismo |
|-----------|-----------|
| Padre → Hijo | Propiedades/atributos |
| Hijo → Padre | CustomEvent |
| Hermanos | Event bus o estado compartido (servicio singleton) |
| Global | Servicio en `shared/scripts/` importado por ambos |

### Anti-patterns
- NO manipular el DOM de otro componente directamente
- NO usar `document.querySelector` para buscar componentes hermanos
- NO poner lógica de negocio en el render — extraer a métodos o servicios
- NO crear componentes monolíticos — dividir en componentes más pequeños si supera ~200 líneas
