# Commits y Pull Requests

## Conventional Commits
- Prefijos: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Mensaje corto (<70 chars) en primera línea
- Descripción detallada si es necesario en líneas siguientes
- NUNCA incluir referencias a Claude, ChatGPT, Copilot o cualquier IA en commits

## PRs Pequeñas para Revisión
Las PRs son revisadas automáticamente por IA. Si el diff es demasiado grande, la review se omitirá o será superficial.

### Reglas
- **Máximo ~300 líneas cambiadas por PR** (ideal < 200)
- Si una tarea requiere más cambios, dividirla en varios commits/PRs incrementales
- Cada PR debe ser **atómica**: un solo propósito claro (1 feature, 1 fix, 1 refactor)
- Preferir varias PRs pequeñas a una PR grande

### Cómo dividir tareas grandes
1. Separar cambios de infraestructura/refactor de cambios funcionales
2. Separar backend de frontend si aplica
3. Separar tests de implementación si el volumen es muy alto
4. Cada PR debe compilar y pasar tests por sí sola

## Ramas
- Crear SIEMPRE una rama por cada tarea o bug antes de empezar a trabajar
- Naming: `feat/{CARD-ID}-descripcion-corta` para tareas, `fix/{CARD-ID}-descripcion-corta` para bugs
- Toda rama se mergea a main mediante Pull Request, nunca push directo a main

## Despliegue
- **NUNCA desplegar automáticamente** salvo que el usuario lo indique explícitamente
- Preguntar antes de ejecutar cualquier acción de deploy
