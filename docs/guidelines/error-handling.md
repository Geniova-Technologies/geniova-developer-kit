# Error Handling

## Principio: fallar explícitamente, nunca en silencio

El sistema funciona o falla. No hay estado intermedio. Un error silenciado es un bug que aparecerá más tarde y será más difícil de diagnosticar.

## Reglas

### PROHIBIDO
- Cadenas `||` para datos críticos: `const user = data.user || {}` oculta que `data.user` es `undefined`
- `catch` vacíos: `catch (err) {}` — si capturas, haz algo con el error
- Fallbacks silenciosos que devuelven datos por defecto cuando deberían fallar
- `console.log` como único manejo de error en producción

### OBLIGATORIO
- Lanzar error si una precondición no se cumple
- Capturar en el boundary más cercano al usuario (UI, endpoint, handler)
- Propagar en capas intermedias — no capturar si no puedes resolver
- Mensajes de error descriptivos y accionables

## Patrones

### Funciones internas: dejar que falle
```javascript
// Las funciones internas NO capturan — confían en que el caller maneja el error
function getDocument(id) {
  const doc = db.collection('users').doc(id)
  return doc.get() // Si falla, el error sube al caller
}
```

### Boundaries: capturar y comunicar
```javascript
// En un endpoint, handler, o componente UI — aquí SÍ capturamos
try {
  const data = await getDocument(userId)
  renderData(data)
} catch (err) {
  logger.error('Error al obtener documento', { userId, error: err.message })
  showNotification('error', 'No se pudo cargar el documento')
}
```

### Validación de entrada: fallar temprano
```javascript
function createTreatment(patientId, type) {
  if (!patientId) throw new Error('patientId es requerido')
  if (!VALID_TYPES.includes(type)) throw new Error(`Tipo inválido: ${type}`)
  // ... lógica
}
```

## Cloud Functions
- Usar `functions.https.HttpsError` para errores de usuario con códigos apropiados
- Loguear con `functions.logger.error()` para errores internos
- No exponer stack traces ni detalles internos al cliente

## Qué loguear en errores
- Contexto: qué operación falló, con qué datos (sin datos sensibles)
- El mensaje de error original
- IDs de entidades involucradas (userId, docId, etc.)
- NO loguear: passwords, tokens, datos personales, stack traces completos en producción
