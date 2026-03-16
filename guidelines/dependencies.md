# Gestión de Dependencias

## Cuándo añadir una dependencia nueva

### Añadir si:
- Resuelve un problema complejo que no tiene sentido reimplementar (crypto, parsers, protocolos)
- Es una dependencia bien mantenida y ampliamente usada
- Ahorra semanas de trabajo y testing
- Es un estándar del ecosistema (Vitest, Playwright, Astro, Lit)

### NO añadir si:
- Se puede resolver en <50 líneas de código propio
- Solo usas una función pequeña de una librería grande
- La librería no se ha actualizado en >1 año
- Tiene muchas dependencias transitivas para lo que ofrece
- Existe una API nativa del navegador o de Node.js que hace lo mismo

## Evaluación antes de añadir

Verificar:
1. **Mantenimiento**: ¿última release < 6 meses? ¿Issues respondidos?
2. **Tamaño**: ¿cuánto añade al bundle? Usar `npx bundlephobia <pkg>` para comprobarlo
3. **Dependencias transitivas**: ¿cuántos paquetes arrastra?
4. **Licencia**: compatible con el proyecto (MIT, Apache-2.0, ISC — OK; GPL — consultar)
5. **Seguridad**: `npm audit` no reporta vulnerabilidades conocidas

## Versionado

- Usar rangos `^` (caret) por defecto: `"vitest": "^3.0.0"`
- Fijar versión exacta solo si hay razones concretas de compatibilidad
- `package-lock.json` SIEMPRE en git — garantiza builds reproducibles
- No commitear `node_modules/`

## Actualización

- Ejecutar `npm audit` regularmente
- Actualizar dependencias con vulnerabilidades conocidas como prioridad
- Usar `npm outdated` para ver qué hay desactualizado
- Actualizar en PRs dedicadas, separadas de cambios funcionales
- Si una actualización rompe algo, usar `overrides` en `package.json` como último recurso

## devDependencies vs dependencies

- `dependencies`: lo que necesita el proyecto en runtime
- `devDependencies`: herramientas de desarrollo, testing, build
- Colocar cada paquete en la categoría correcta — afecta al bundle de producción
