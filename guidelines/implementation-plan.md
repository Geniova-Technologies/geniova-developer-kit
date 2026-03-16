# Implementation Plan

## Cuándo rellenar

Rellenar ANTES de empezar a implementar cuando:
- devPoints >= 3
- La tarea afecta a más de 2 ficheros
- Requiere cambios en modelo de datos o APIs
- Hay múltiples enfoques posibles

## Cómo rellenar

1. `approach`: Explicar brevemente el enfoque elegido y por qué (1-3 frases)
2. `steps`: Un paso por cada commit planificado. Incluir ficheros afectados
3. `dataModelChanges`: Solo si hay cambios en colecciones/documentos Firestore, tablas, etc.
4. `apiChanges`: Solo si hay cambios en endpoints o Cloud Functions
5. `risks`: Qué puede fallar o qué dependencias existen
6. `outOfScope`: Qué queda fuera explícitamente para evitar scope creep

## Ejemplo

Para una tarea "Añadir preferencias de notificaciones":
```json
{
  "approach": "Añadir subcolección notificationPreferences en /users/{uid} con documento de preferencias. Toggle en dropdown de usuario con modal de configuración.",
  "steps": [
    { "description": "Crear modelo de datos y métodos Firestore para preferencias", "files": "src/shared/utils/firestoreMethods.js, firestore.rules", "status": "pending" },
    { "description": "Crear modal de preferencias y lógica UI", "files": "src/shared/scripts/modals.js, src/shared/styles/modalsStyles.css", "status": "pending" },
    { "description": "Integrar con sistema de envío de email", "files": "src/shared/utils/emailService.js, src/pages/api/notifyChat.js", "status": "pending" }
  ],
  "dataModelChanges": "/users/{uid}/notificationPreferences: { emailOnNewMessage: bool, emailOnStatusChange: bool, emailOnAssignment: bool }",
  "apiChanges": "Modificar notifyChat.js para consultar preferencias antes de enviar",
  "risks": "Usuarios existentes no tendrán preferencias → usar defaults (todo activado)",
  "outOfScope": "Notificaciones push, preferencias por ticket individual",
  "planStatus": "proposed"
}
```

## Estados del plan (planStatus)

- `pending`: Plan no iniciado
- `proposed`: Plan propuesto, pendiente de validación
- `validated`: Plan aprobado por el equipo
- `in_progress`: Implementación en curso
- `completed`: Plan completado
