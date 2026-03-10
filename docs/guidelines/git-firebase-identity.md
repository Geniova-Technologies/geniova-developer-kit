# Git & Firebase Identity

## Principio: cada proyecto tiene su identidad

Los proyectos de Geniova usan cuentas corporativas. Antes de hacer push o deploy, verificar que la identidad configurada es la correcta para el proyecto.

## Git

### Verificar antes de push
```bash
git config user.name   # Debe coincidir con la cuenta del proyecto
git config user.email  # Debe ser el email corporativo correcto
```

### Configurar por proyecto
```bash
# En la raíz del proyecto (NO --global)
git config user.name "Nombre Apellido"
git config user.email "usuario@geniova.com"
```

### Autenticación: SSH obligatorio
- **SIEMPRE** usar SSH para clonar y conectar repos, nunca HTTPS
- Los remotos deben usar el formato `git@github.com:Org/repo.git`
- Si un remoto está configurado con HTTPS, cambiarlo a SSH:
```bash
git remote set-url origin git@github.com:Geniova-Technologies/mi-repo.git
```
- Verificar que la clave SSH del usuario está añadida en GitHub

### Emails permitidos
Cada proyecto define en `.githooksrc.json` los emails autorizados:
```json
{
  "push": {
    "allowedEmails": ["*@geniova.com"]
  }
}
```

El hook `pre-push` valida automáticamente que `user.email` coincide con la lista. Si no coincide, bloquea el push y avisa.

## Firebase multi-account

Cuando un desarrollador tiene varias cuentas Firebase en la misma máquina (personal y corporativa), es crítico especificar siempre la cuenta correcta.

### PROHIBIDO: `firebase login:use`
- **NUNCA** usar `firebase login:use` para cambiar la cuenta por defecto
- Cambia el estado global y afecta a TODAS las instancias y proyectos de la máquina simultáneamente
- Si hay varias terminales o proyectos en paralelo, rompe los que usen otra cuenta
- Está **PROHIBIDO** en proyectos Geniova

### OBLIGATORIO: flag `--account` en cada comando
SIEMPRE usar el flag `--account` con la cuenta corporativa de Geniova del usuario:

```bash
# Deploy
firebase deploy --only hosting --account usuario@geniova.com
firebase deploy --only functions --account usuario@geniova.com

# Otros comandos
firebase functions:log --account usuario@geniova.com
firebase firestore:indexes --account usuario@geniova.com
```

### Ver cuentas disponibles
```bash
firebase login:list
```

Si la cuenta corporativa no aparece, añadirla con `firebase login:add`.

## Para agentes IA
- SIEMPRE usar SSH para remotos git, nunca HTTPS
- SIEMPRE verificar `git config user.email` antes de hacer push — debe ser la cuenta Geniova del usuario
- SIEMPRE usar `--account` con la cuenta Geniova del usuario en TODOS los comandos Firebase
- NUNCA ejecutar `firebase login:use` — está PROHIBIDO
- Si no se conoce la cuenta Geniova del usuario, preguntar antes de ejecutar cualquier comando Firebase o git push
- Si la identidad no coincide con el proyecto, DETENER la operación y avisar al usuario
