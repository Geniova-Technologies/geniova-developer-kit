import { execSync } from 'node:child_process'
import { logger } from '../utils/logger.js'

/**
 * Check: Valida que el git user.email coincide con los emails permitidos.
 *
 * @param {object} [options]
 * @param {string[]} [options.allowedEmails] - Patrones permitidos (ej: ["*@geniova.com", "user@gmail.com"])
 * @returns {{passed: boolean, email: string, reason?: string}}
 */
export function runPushIdentityCheck({ allowedEmails = [] } = {}) {
  if (allowedEmails.length === 0) {
    logger.info('Push identity: sin emails configurados, check omitido')
    return { passed: true, email: '' }
  }

  let email
  try {
    email = execSync('git config user.email', { encoding: 'utf-8' }).trim()
  } catch {
    logger.error('No se pudo obtener git user.email')
    return { passed: false, email: '', reason: 'git user.email no configurado' }
  }

  if (!email) {
    logger.error('git user.email está vacío')
    return { passed: false, email: '', reason: 'git user.email está vacío' }
  }

  const matches = allowedEmails.some((pattern) => matchEmail(email, pattern))

  if (!matches) {
    logger.blank()
    logger.error('Push bloqueado: identidad de git incorrecta')
    logger.detail('Email actual', email)
    logger.detail('Emails permitidos', allowedEmails.join(', '))
    logger.blank()
    logger.info('Configura el email correcto con:')
    logger.dim('git config user.email "tu-email@geniova.com"')
  } else {
    logger.success(`Push identity: ${email}`)
  }

  return {
    passed: matches,
    email,
    reason: matches ? undefined : `${email} no coincide con los emails permitidos`,
  }
}

/**
 * Compara un email contra un patrón (soporta wildcard * al inicio).
 * @param {string} email
 * @param {string} pattern - Ej: "*@geniova.com", "user@gmail.com"
 * @returns {boolean}
 */
function matchEmail(email, pattern) {
  if (pattern.startsWith('*')) {
    const suffix = pattern.slice(1).toLowerCase()
    return email.toLowerCase().endsWith(suffix)
  }
  return email.toLowerCase() === pattern.toLowerCase()
}
