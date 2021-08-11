import jsonwebtoken from 'jsonwebtoken'
import createDebug from 'debug'
import { is, type, array, string, Infer, coerce, refine } from 'superstruct'

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

  signToken(token: EmailLoginToken | AuthToken, options: JwtSignOptions = {}) {
    debug('sign %o', token)
    return jsonwebtoken.sign(token, this.#env.JWT_SECRET, {
      ...options,
      issuer: JWT_ISSUER,
    })
  }

  verifyToken(token: string) {
    debug('verify %o', token)
    return jsonwebtoken.verify(token, this.#env.JWT_SECRET, {
      issuer: JWT_ISSUER,
    })
  }

  fromSocketId(socketId: string) {
    debug('fromSocketId %o', socketId)
    return this.#store.retrieve<AuthToken>(`auth_${socketId}`)
  }

  fromRequestHeaders(headers: any) {
    debug('fromRequestHeaders %o', headers?.authorization)

    if (!is(headers, AuthzHeaders)) throw ApiError.notAuthorized()

    const authorization = headers.authorization.replace(bearerRegex(), '')
    const token = this.verifyToken(authorization) as AuthToken

    if (typeof token !== 'object' || token.kind !== 'auth') {
      throw ApiError.notAuthorized()
    }

    return token as AuthToken
  }
}
