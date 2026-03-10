# Estándares de Testing

## Desarrollo Test-First (Obligatorio)
1. ANTES de cualquier cambio, verificar si existen tests
2. Si NO existen tests: CREAR TESTS PRIMERO
3. Hacer UN cambio pequeño a la vez
4. Ejecutar tests después de CADA cambio

## Tipos de Tests
- **Unit Tests**: Para funciones y clases aisladas (Vitest)
- **Integration Tests**: Para servicios que interactúan
- **E2E Tests**: Para flujos completos de usuario (Playwright)

## Convenciones
```javascript
describe('NombreComponente', () => {
  describe('nombreMetodo', () => {
    it('debería [resultado esperado] cuando [condición]', () => {
      // Arrange - Act - Assert
    });
  });
});
```

## Coverage Mínimo
- Servicios: 80%
- Utilidades: 90%
- Componentes críticos: 70%

## Nunca Saltar Tests
- Si fallan, ARREGLAR antes de continuar
- Si hay que cambiar comportamiento, actualizar tests PRIMERO
