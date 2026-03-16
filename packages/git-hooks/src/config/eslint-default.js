/**
 * Configuración ESLint por defecto para proyectos Geniova sin config propia.
 * Basada en la config de geniova-auth.
 *
 * Se usa dinámicamente cuando el proyecto no tiene eslint.config.js propio.
 * Requiere que @eslint/js y globals estén disponibles.
 */
export async function getDefaultEslintConfig() {
  try {
    const [{ default: eslint }, { default: globals }] = await Promise.all([
      import('@eslint/js'),
      import('globals'),
    ])

    return [
      eslint.configs.recommended,
      {
        ignores: [
          '**/dist/**',
          '**/node_modules/**',
          '**/.firebase/**',
          '**/build/**',
          '**/coverage/**',
          '**/docs/**',
          '**/scripts/**',
        ],
      },
      {
        languageOptions: {
          ecmaVersion: 2024,
          sourceType: 'module',
          globals: {
            ...globals.node,
            ...globals.browser,
          },
        },
        rules: {
          'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
          'no-console': 'off',
        },
      },
    ]
  } catch {
    return null
  }
}
