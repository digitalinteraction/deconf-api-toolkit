import jsonwebtoken from 'jsonwebtoken'
import createDebug from 'debug'
import {
  is,
  type,
  array,
  string,
  refine,
  literal,
  number,
  Struct,
} from 'superstruct'

import { AuthToken, Interpreter } from '@openlab/deconf-shared'
import { ApiError } from './api-error'
import { DeconfBaseContext } from './context'
import { assertStruct } from './structs'

/** @deprecated use JWT_DEFAULT_ISSUER */
export const JWT_ISSUER = 'deconf-app'
export const JWT_DEFAULT_ISSUER = 'deconf-app'

const debug = createDebug('deconf:lib:jwt')
export const bearerRegex = () => /^bearer\s+/i

//
// Structs
//
function authzHeader() {
  return refine(string(), 'authz-bearer', (value) => bearerRegex().test(value))
}

export const AuthzHeadersStruct = type({
  authorization: authzHeader(),
})

export const AuthTokenStruct = type({
  kind: literal('auth'),
  sub: number(),
  user_roles: array(string()),
  user_lang: string(),
})

export const EmailLoginTokenStruct = type({
  kind: literal('email-login'),
  sub: number(),
  user_roles: array(string()),
})

export const VerifyTokenStruct = type({
  kind: literal('verify'),
  sub: number(),
})

//
// Types
//
export interface JwtSignOptions {
  expiresIn?: string | number
}

export interface SocketAuth {
  authToken: AuthToken
  email: string
  interpreter: Interpreter | null

  // Not including Registration because json & dates
}

//
// Service
//

type JwtEnv = Pick<DeconfBaseContext['env'], 'JWT_SECRET'>
type Context = Pick<DeconfBaseContext, 'store' | 'config'> & { env: JwtEnv }

export class JwtService {
  get #store() {
    return this.#context.store
  }
  get #env() {
    return this.#context.env
  }
  get #config() {
    return this.#context.config
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  #getIssuer(): string {
    return this.#config.jwt?.issuer ?? JWT_DEFAULT_ISSUER
  }

  verifyToken<T extends object>(token: string, struct: Struct<T>): T {
    debug('verifyToken %o', token)
    try {
      const result = jsonwebtoken.verify(token, this.#env.JWT_SECRET, {
        issuer: this.#getIssuer(),
      })

      assertStruct(result, struct)

      return result
    } catch (error) {
      // https://github.com/auth0/node-jsonwebtoken#notbeforeerror
      if (error instanceof jsonwebtoken.NotBeforeError) {
        throw new ApiError(401, ['auth.tooEarly'])
      }

      // https://github.com/auth0/node-jsonwebtoken#tokenexpirederror
      if (error instanceof jsonwebtoken.TokenExpiredError) {
        throw new ApiError(401, ['auth.tokenExpired'])
      }

      // https://github.com/auth0/node-jsonwebtoken#jsonwebtokenerror
      if (error instanceof jsonwebtoken.JsonWebTokenError) {
        debug('JWT ERROR %o', error.message)
        throw new ApiError(401, ['auth.badToken'])
      }

      // Pass-through ApiErrors
      if (error instanceof ApiError) throw error

      throw ApiError.internalServerError()
    }
  }

  signToken<T extends object>(token: T, options: JwtSignOptions = {}) {
    debug('sign %o', token)
    return jsonwebtoken.sign(token, this.#env.JWT_SECRET, {
      ...options,
      issuer: this.#getIssuer(),
    })
  }

  async getSocketAuth(socketId: string) {
    debug('fromSocketId %o', socketId)
    const auth = await this.#store.retrieve<SocketAuth>(`auth/${socketId}`)
    if (!auth) throw ApiError.unauthorized()
    return auth
  }

  getRequestAuth(headers: any) {
    debug('fromRequestHeaders %o', headers?.authorization)

    if (!is(headers, AuthzHeadersStruct)) return null

    const authorization = headers.authorization.replace(bearerRegex(), '')
    const token = this.verifyToken(authorization, AuthTokenStruct)

    if (typeof token !== 'object' || token.kind !== 'auth') return null

    return token as AuthToken
  }
}
