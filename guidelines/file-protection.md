# Protección contra Sobreescrituras Accidentales

## REGLA CRÍTICA: NUNCA sobreescribir archivos existentes

- **PROHIBIDO** usar sobreescritura completa (Write) en archivos que ya existen
- **SIEMPRE** usar ediciones puntuales (Edit) para modificar archivos existentes
- Aplica especialmente a: CSS, JS, HTML, Astro, configuraciones
- Si necesitas añadir código nuevo a un archivo existente, insertar en el punto exacto
- **VERIFICAR** con `git diff` después de cada edición para confirmar que SOLO cambió lo esperado
- Si una edición modifica líneas que NO debería haber tocado, revertir inmediatamente con `git checkout -- <archivo>`
- La única excepción es crear archivos nuevos que no existían previamente

## Razón

Sobreescribir archivos completos destruye cambios previos (colores corporativos, estilos, lógica de negocio) que pueden haber sido realizados en sesiones anteriores y que no están en el contexto actual.
