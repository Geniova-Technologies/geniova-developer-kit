# Guías de Seguridad

## Validación de Entrada
- SIEMPRE validar entrada del usuario
- Sanitizar datos antes de mostrar (XSS)
- Usar prepared statements/parameterized queries (SQL injection)

## Datos Sensibles
- NUNCA commitear credenciales, API keys, secrets
- Usar variables de entorno (.env)
- Archivos .env en .gitignore
- serviceAccountKey.json NUNCA en git

## Dependencias
- Ejecutar `npm audit` regularmente
- Actualizar dependencias con vulnerabilidades conocidas
- Usar overrides en package.json si es necesario

## Firebase Específico
- Reglas de seguridad en Firestore/RTDB
- Validar permisos en Cloud Functions
- No exponer Admin SDK en cliente
