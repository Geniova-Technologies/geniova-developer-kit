import { execSync } from 'node:child_process'
import { logger } from '../utils/logger.js'

/**
 * Check: Valida que el remote usa SSH, no HTTPS.
 *
 * @param {object} [options]
 * @param {string} [options.remote='origin'] - Nombre del remote a validar
 * @returns {{passed: boolean, url: string, reason?: string}}
 */
export function runPushSshCheck({ remote = 'origin' } = {}) {
  let url
  try {
    url = execSync(`git remote get-url ${remote}`, { encoding: 'utf-8' }).trim()
  } catch {
    logger.info(`Remote "${remote}" no encontrado, check SSH omitido`)
    return { passed: true, url: '' }
  }

  if (!url) {
    logger.info('Remote URL vacía, check SSH omitido')
    return { passed: true, url: '' }
  }

  const isHttps = /^https?:\/\//i.test(url)

  if (isHttps) {
    const sshUrl = httpsToSsh(url)
    logger.blank()
    logger.error('Push bloqueado: el remote usa HTTPS en lugar de SSH')
    logger.detail('Remote actual', url)
    logger.detail('Debe ser (SSH)', sshUrl)
    logger.blank()
    logger.info('Cambia el remote a SSH con:')
    logger.dim(`git remote set-url ${remote} ${sshUrl}`)

    return {
      passed: false,
      url,
      reason: `Remote "${remote}" usa HTTPS. Cambiar a SSH: ${sshUrl}`,
    }
  }

  logger.success(`Remote SSH: ${url}`)
  return { passed: true, url }
}

/**
 * Convierte una URL HTTPS de GitHub/GitLab a SSH.
 * @param {string} httpsUrl
 * @returns {string}
 */
function httpsToSsh(httpsUrl) {
  // https://github.com/Org/repo.git → git@github.com:Org/repo.git
  const match = httpsUrl.match(/^https?:\/\/([^/]+)\/(.+)$/)
  if (match) {
    return `git@${match[1]}:${match[2]}`
  }
  return httpsUrl
}
