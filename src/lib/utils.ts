import { ApiError } from './api-error.js'

export { default as createDebug } from 'debug'

export interface VoidResponse {
  message: 'ok'
}

export const VOID_RESPONSE: VoidResponse = Object.seal({ message: 'ok' })

/**
 * From a potential ApiError, see if it is a well-known code and return
 * a URL slug for `ApiMessage`
 */
export function getRedirectErrorCode(error: unknown) {
  let errorCode: string | undefined = undefined

  if (error instanceof ApiError) {
    for (const code of error.codes) {
      if (code === 'general.notFound') return 'not_found'
      if (code === 'auth.tokenExpired') return 'login_expired'
    }
  }

  return errorCode
}

export function trimEmail(input?: string) {
  return input?.trim().toLowerCase() ?? ''
}
