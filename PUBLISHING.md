# Publicar @geniova/developer-kit en npmjs.com

## Requisitos

- Cuenta npm `geniova` con acceso read-write al paquete `@geniova/developer-kit`
- Token granular de npm (se crea en https://www.npmjs.com/settings/geniova/tokens)
  - Tipo: **Granular Access Token**
  - Packages: **Only select packages** > `@geniova/developer-kit`
  - Permissions: **Read and write**
  - Caduca cada 90 dias (maximo permitido por npm)

## Publicar

```bash
# 1. Bump version en package.json y src/utils/logger.js (banner)
# 2. Commit y push
# 3. Publicar con el token granular:
NPM_TOKEN=npm_XXXX npm publish --access public --//registry.npmjs.org/:_authToken=$NPM_TOKEN
```

## Notas

- Este paquete se publica en **npmjs.com** (publico), NO en GitHub Packages
- El paquete privado `@geniova-technologies/geniova-kit` se publica aparte en GitHub Packages (ver su repo)
- npm exige 2FA o token granular para publicar paquetes con scope
- Si el token ha caducado, crea uno nuevo en https://www.npmjs.com/settings/geniova/tokens
- Verificar publicacion: `npm view @geniova/developer-kit versions`

## Arquitectura de paquetes

```
npx @geniova/developer-kit init          (npmjs.com - publico)
  └─ npx @geniova-technologies/geniova-kit  (GitHub Packages - privado)
       └─ npx @geniova/git-hooks init          (GitHub Packages - privado)
```
