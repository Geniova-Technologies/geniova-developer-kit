# Guías de UI/UX

## Diálogos y Modales
- NUNCA usar alert(), confirm(), prompt() nativos del navegador
- Usar siempre el sistema de modales de la aplicación (ModalService, AppModal)
- Los modales deben seguir el patrón existente en el codebase

## Feedback al Usuario
- Mostrar loading/spinner durante operaciones asíncronas
- Notificaciones toast para éxito/error (SlideNotification)
- Mensajes de error claros y accionables

## Accesibilidad
- Labels en todos los inputs
- Contraste suficiente en colores
- Navegación por teclado

## Responsive
- Mobile-first cuando sea posible
- Breakpoints consistentes
- Touch-friendly en móviles
