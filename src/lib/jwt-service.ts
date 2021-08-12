import jsonwebtoken from 'jsonwebtoken'
import createDebug from 'debug'
import {
  is,
  type,
  array,
  string,
  Infer,
  coerce,
  refine,
  Describe,
  literal,
  number,
} from 'superstruct'

import { ApiError } from './api-error'
import { Contextual, DeconfBaseContext } from './context'
import { AuthToken, EmailLoginToken } from '@openlab/deconf-shared'

// TODO: move to config
export const JWT_ISSUER = 'deconf-app'

const debug = createDebug('deconf:lib:jwt')

export const bearerRegex = () => /^bearer\s+/i

//
// Structs
//
function authzHeader() {
  return refine(string(), 'authz-bearer', (value) => bearerRegex().test(value))
}

export const AuthzHeaders = type({
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

//
// Types
//
export interface JwtSignOptions {
  expiresIn?: string | number
}

//
// Service
//

type Context = Pick<DeconfBaseContext, 'store' | 'env'>

export class JwtService {
  get #store() {
    return this.#context.store
  }
  get #env() {
    return this.#context.env
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  #verifyToken(token: string) {
    debug('verifyToken %o', token)
    try {
      return jsonwebtoken.verify(token, this.#env.JWT_SECRET, {
        issuer: JWT_ISSUER,
      })
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

      throw ApiError.unknown()
    }
  }

  signToken(token: EmailLoginToken | AuthToken, options: JwtSignOptions = {}) {
    debug('sign %o', token)
    return jsonwebtoken.sign(token, this.#env.JWT_SECRET, {
      ...options,
      issuer: JWT_ISSUER,
    })
  }

  verifyAuthToken(token: string) {
    const result = this.#verifyToken(token)
    if (!is(result, AuthTokenStruct)) {
      throw new ApiError(401, ['auth.badToken'])
    }
    return result
  }

  verifyEmailLoginToken(token: string) {
    const result = this.#verifyToken(token)
    if (!is(result, EmailLoginTokenStruct)) {
      throw new ApiError(401, ['auth.badToken'])
    }
    return result
  }

  fromSocketId(socketId: string) {
    debug('fromSocketId %o', socketId)
    return this.#store.retrieve<AuthToken>(`auth_${socketId}`)
  }

  fromRequestHeaders(headers: any) {
    debug('fromRequestHeaders %o', headers?.authorization)

    if (!is(headers, AuthzHeaders)) throw ApiError.notAuthorized()

    const authorization = headers.authorization.replace(bearerRegex(), '')
    const token = this.verifyAuthToken(authorization) as AuthToken

    if (typeof token !== 'object' || token.kind !== 'auth') {
      throw ApiError.notAuthorized()
    }

    return token as AuthToken
  }
}
