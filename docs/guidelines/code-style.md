# Guías de Estilo de Código

## Principios Generales
- **SOLID**: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It

## Vanilla JS + JSDoc (preferencia por defecto)

El stack por defecto en proyectos Geniova es **JavaScript vanilla con tipado vía JSDoc y ficheros `.d.ts`**, sin TypeScript.

- Escribir código en `.js` con anotaciones JSDoc para tipos
- Crear ficheros `.d.ts` para definiciones de tipos complejas, interfaces y tipos compartidos
- Los IDEs (VS Code) ofrecen autocompletado, validación y refactoring igual que con TypeScript
- Activar `"checkJs": true` en `jsconfig.json` o `tsconfig.json` para validación de tipos sin compilación

```javascript
// utils/firestore-methods.js

/** @typedef {import('./types').Treatment} Treatment */

/**
 * @param {string} patientId
 * @returns {Promise<Treatment[]>}
 */
export async function getTreatments(patientId) {
  // ...
}
```

```typescript
// utils/types.d.ts
export interface Treatment {
  id: string
  patientId: string
  type: 'aligners' | 'retainers'
  status: 'draft' | 'active' | 'completed'
  createdAt: Date
}
```

### Cuándo sí usar TypeScript
- Si el proyecto ya está en TypeScript — no migrar a JS
- Librerías/paquetes npm que se publican — TypeScript aporta `.d.ts` automáticos
- Si el equipo del proyecto lo decide explícitamente

### Convenciones JS
- Usar `const` por defecto, `let` solo cuando sea necesario
- Preferir arrow functions para callbacks
- Usar template literals para strings con variables
- Nombrar funciones y variables en inglés, descriptivamente

## Sin Fallbacks Silenciosos
- El sistema funciona o falla, nunca silenciosamente
- Lanzar errores en lugar de usar valores por defecto incorrectos
- Cadenas `||` para datos críticos está PROHIBIDO

## Sobre-ingeniería
- No añadir features, refactors o "mejoras" que no se hayan pedido
- No añadir error handling, fallbacks o validación para escenarios imposibles
- No crear helpers, utilidades o abstracciones para operaciones puntuales
- No diseñar para requisitos hipotéticos futuros
- Tres líneas similares son mejores que una abstracción prematura
- No añadir docstrings, comentarios o type annotations a código que no has cambiado
- Solo añadir comentarios donde la lógica no sea evidente
