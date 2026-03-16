# Firebase / Firestore Patterns

## Estructura de colecciones

### Principios
- Modelar para las queries que necesitas, no para la forma de los datos
- Preferir desnormalización cuando reduce queries complejas
- Subcolecciones para relaciones 1:N con acceso independiente
- Campos anidados (maps) para datos que siempre se leen/escriben juntos

### Campos estándar
Toda colección principal debe incluir:
```
createdAt: Timestamp    — fecha de creación
createdBy: string       — uid del creador
updatedAt: Timestamp    — última modificación
updatedBy: string       — uid del último editor
```

## Security Rules

### Principio: denegar por defecto
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Denegar todo por defecto
    match /{document=**} {
      allow read, write: if false;
    }

    // Abrir explícitamente lo necesario
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

### Reglas obligatorias
- Validar `request.auth != null` para todo acceso autenticado
- Validar que el usuario tiene el rol necesario para la operación
- Validar tipos y campos requeridos en escrituras con `request.resource.data`
- No confiar en datos del cliente — validar en rules Y en Cloud Functions si es crítico

## Cloud Functions

### Convenciones
- Un fichero por dominio funcional: `users.js`, `treatments.js`, `notifications.js`
- Exportar funciones con nombre descriptivo del trigger:
  - `onUserCreated` — trigger onCreate en colección users
  - `onTreatmentUpdated` — trigger onUpdate en colección treatments
  - `httpsCreateTreatment` — función callable/HTTP

### Idempotencia
- Los triggers de Firestore pueden ejecutarse más de una vez
- Diseñar funciones idempotentes: la misma ejecución repetida produce el mismo resultado
- Usar transacciones cuando necesites read-then-write atómico

### Admin SDK
- SOLO en server-side (Cloud Functions, scripts de admin)
- NUNCA exponer en cliente
- `serviceAccountKey.json` NUNCA en git — usar variables de entorno o Secret Manager

## Transacciones y Batched Writes

### Transacciones — cuando necesitas leer antes de escribir
```javascript
await db.runTransaction(async (transaction) => {
  const doc = await transaction.get(docRef)
  const currentValue = doc.data().counter
  transaction.update(docRef, { counter: currentValue + 1 })
})
```

### Batched Writes — cuando solo necesitas escribir
```javascript
const batch = db.batch()
batch.set(docRef1, data1)
batch.update(docRef2, { field: value })
batch.delete(docRef3)
await batch.commit() // Atómico: todo o nada
```

### Límites
- Máximo 500 operaciones por batch
- Transacciones tienen timeout de 270 segundos
- Para operaciones masivas, dividir en batches de 500

## Entornos con .env por ambiente

En proyectos Firebase con Astro (u otros frameworks), usar ficheros `.env` separados por entorno para apuntar a distintos proyectos Firebase (dev, pre, prod).

### Estructura de ficheros
```
.env.dev      — Firebase proyecto de desarrollo
.env.pre      — Firebase proyecto de pre-producción
.env.prod     — Firebase proyecto de producción
.env          — Generado automáticamente, NUNCA editarlo a mano
```

### Prerequisito: una base de datos por entorno

Dentro del **mismo proyecto Firebase**, crear 3 bases de datos separadas para aislar los datos de cada entorno. Firebase permite múltiples instancias tanto en Firestore como en RTDB.

**Firestore** (multi-database, disponible desde 2023):
| Entorno | Database ID | Uso |
|---------|-------------|-----|
| dev | `(default)` o `dev` | Desarrollo local, pruebas de integración |
| pre | `pre` | Validación previa a producción, testing QA |
| prod | `prod` | Producción, datos reales |

**RTDB** (múltiples instancias):
| Entorno | Instance | Uso |
|---------|----------|-----|
| dev | `my-app-dev.firebaseio.com` | Desarrollo local |
| pre | `my-app-pre.firebaseio.com` | Pre-producción |
| prod | `my-app-prod.firebaseio.com` | Producción |

Crear las bases de datos adicionales desde la consola de Firebase antes de configurar los `.env.*`.

### Contenido de cada .env.*
```env
# .env.dev — mismo proyecto, BBDD de desarrollo
PUBLIC_FIREBASE_API_KEY=AIza...
PUBLIC_FIREBASE_AUTH_DOMAIN=my-app.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=my-app
PUBLIC_FIREBASE_STORAGE_BUCKET=my-app.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
PUBLIC_FIRESTORE_DATABASE_ID=dev
PUBLIC_RTDB_URL=https://my-app-dev.firebaseio.com
```

Los campos comunes del proyecto (`API_KEY`, `PROJECT_ID`, etc.) son los mismos en los 3 ficheros. Lo que cambia entre entornos es el **database ID** (Firestore) y/o la **URL de instancia** (RTDB).

### Scripts en package.json
```json
{
  "scripts": {
    "dev": "cp .env.dev .env && astro dev",
    "build": "cp .env.prod .env && astro build",
    "pre": "cp .env.pre .env && astro preview --host",
    "deploy:pre": "cp .env.pre .env && astro build && firebase deploy --project my-app-pre",
    "deploy:prod": "cp .env.prod .env && astro build && firebase deploy --project my-app-prod"
  }
}
```

### Reglas
- `.env` en `.gitignore` — es generado, no se versiona
- `.env.dev`, `.env.pre`, `.env.prod` SÍ se versionan (no contienen secrets, solo config de Firebase pública)
- Si hay secrets reales (API keys privadas, service accounts), esos van en Secret Manager o variables de entorno del CI, NUNCA en estos ficheros
- El prefijo `PUBLIC_` (Astro) o `VITE_` (Vite) indica que la variable es accesible en cliente — solo poner ahí config pública de Firebase
- Cada `npm run` se encarga de copiar el `.env` correcto antes de ejecutar

### .gitignore
```
.env
```

## Índices
- Firestore crea índices automáticos para campos simples
- Queries compuestas (varios campos, ordenación + filtro) requieren índices compuestos
- Si una query falla con error de índice, seguir el link del error para crearlo en la consola
- Documentar índices compuestos en `firestore.indexes.json`
