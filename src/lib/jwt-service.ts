import jsonwebtoken from 'jsonwebtoken'
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
import { createDebug } from './utils'

/** @deprecated use [[JWT_DEFAULT_ISSUER]] */
export const JWT_ISSUER = 'deconf-app'

/** `JWT_DEFAULT_ISSUER` is the fallback JWT `iss` (issuer) if it has not set via config. */
export const JWT_DEFAULT_ISSUER = 'deconf-app'

const debug = createDebug('deconf:lib:jwt')

/**
 * `bearerRegex` creates a regex to test if a string is a `bearer xyz` header.
 * It is case insensitive.
 */
export const bearerRegex = () => /^bearer\s+/i

//
// Structs
//
function authzHeader() {
  return refine(string(), 'authz-bearer', (value) => bearerRegex().test(value))
}

/**
 * `AuthzHeadersStruct` is a structure to assert an object containing authorization headers.
 */
export const AuthzHeadersStruct = type({
  authorization: authzHeader(),
})

/**
 * `AuthTokenStruct` is structure to assert an object is an 'auth' JWT payload
 */
export const AuthTokenStruct = type({
  kind: literal('auth'),
  sub: number(),
  user_roles: array(string()),
  user_lang: string(),
})

/**
 * `EmailLoginTokenStruct` is a structure to assert an object is an 'email-login' JWT payload
 */
export const EmailLoginTokenStruct = type({
  kind: literal('email-login'),
  sub: number(),
  user_roles: array(string()),
})

/**
 * `VerifyTokenStruct` is a structure to assert an object is a 'verify' JWT payload
 */
export const VerifyTokenStruct = type({
  kind: literal('verify'),
  sub: number(),
})

/**
 * `UserICalTokenStruct` is a structure to assert an object is a user-ical JWT payload
 */
export const UserICalTokenStruct = type({
  kind: literal('user-ical'),
  sub: number(),
  user_lang: string(),
})

//
// Types
//

/**
 * `JwtSignOptions` is a type containing extra options when signing a JWT
 */
export interface JwtSignOptions {
  expiresIn?: string | number
}

/**
 * `SocketAuth` is a collection of data about a user to be stored together against
 * a socket id for the purpose of authenticating and accessing information about them.
 */
export interface SocketAuth {
  authToken: AuthToken
  email: string
  interpreter: Interpreter | null

  // Not including Registration because json & dates
}

/** `UserICalToken` is a JWT payload to access a user's private ical feed */
export interface UserICalToken {
  kind: 'user-ical'
  sub: number
  user_lang: string
}

//
// Service
//

type Context = Pick<DeconfBaseContext, 'store'> & {
  /** @deprecated use `jwtConfig` instead */
  config: {
    jwt?: DeconfBaseContext['config']['jwt']
  }

  env: Pick<DeconfBaseContext['env'], 'JWT_SECRET'>
  jwtConfig?: {
    issuer: string
  }
}

/**
 * `JwtService` is a service for verifying and signing JWTs.
 * It requires a `store`, `config` and an `env` with `JWT_SECRET` in it.
 * It also manages socket authentication, storing auth data in the `store`.
 *
 * ```ts
 * const store: KeyValueService
 * const config: DeconfConfig
 * const env: DeconfEnv
 *
 * const jwt = new JwtService({ store, config, env })
 * ```
 */
export class JwtService {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  #getIssuer(): string {
    return (
      this.#context.jwtConfig?.issuer ??
      this.#context.config.jwt?.issuer ??
      JWT_DEFAULT_ISSUER
    )
  }

  /**
   * `verifyToken` verifies a JWT string was signed by the app and conforms to a structure.
   * It throws `ApiError(401)` errors if something is wrong:
   *
   * - `auth.tooEarly`
   * - `auth.tokenExpired`
   * - `auth.badToken`
   *
   * or a `StructApiError` if the payload does not match the structure.
   * If it doesn't throw, it returns the decoded payload.
   *
   * ```ts
   * const NameStruct = object({ name: string() })
   * const payload = jwt.verifyToken('abc.def.ghi', NameStruct)
   * ```
   */
  verifyToken<T extends object>(token: string, struct: Struct<T>): T {
    debug('verifyToken %o', token)
    try {
      const result = jsonwebtoken.verify(token, this.#context.env.JWT_SECRET, {
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

  /**
   * `signToken` takes a JWT payload, signs it and returns it as a JWT string.
   * You can pass extra options with a `JwtSIgnOptions`.
   *
   * > See https://github.com/auth0/node-jsonwebtoken#usage for more options.
   *
   * ```ts
   * const token = jwt.signToken({ name: 'Geoff' }, { expiresIn: '55m' })
   * ```
   */
  signToken<T extends object>(token: T, options: JwtSignOptions = {}) {
    debug('sign %o', token)
    return jsonwebtoken.sign(token, this.#context.env.JWT_SECRET, {
      ...options,
      issuer: this.#getIssuer(),
    })
  }

  /**
   * `getSocketAuth` retrieves the authentication packet for a socket.
   * It takes the socket's id as a parameter
   * and it will throw a `http/401` if the packet isn't found.
   *
   * ```ts
   * const auth = await jwt.getSocketAuth('abcdefg')
   * ```
   */
  async getSocketAuth(socketId: string) {
    debug('fromSocketId %o', socketId)
    const auth = await this.#context.store.retrieve<SocketAuth>(
      `auth/${socketId}`
    )
    if (!auth) throw ApiError.unauthorized()
    return auth
  }

  /**
   * `getRequestAuth` is a helper to find and verify an authentication token out of a http headers object.
   * It returns `null` if one is not found or a `AuthToken` if it is.
   * It will also throw the same errors as `verifyToken`.
   *
   * ```ts
   * const payload = jwt.getRequestAuth({
   *   authorization: 'bearer abc.def.ghi',
   * })
   * ```
   */
  getRequestAuth(headers: any) {
    debug('fromRequestHeaders %o', headers?.authorization)

    if (!is(headers, AuthzHeadersStruct)) return null

    const authorization = headers.authorization.replace(bearerRegex(), '')
    const token = this.verifyToken(authorization, AuthTokenStruct)

    if (typeof token !== 'object' || token.kind !== 'auth') return null

    return token as AuthToken
  }
}
