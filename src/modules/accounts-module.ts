import { query } from 'express'
import { HttpResponse } from '../http-response'
import emailRegex = require('email-regex')
import {
  AuthToken,
  JwtService,
  QueryService,
  EmailLoginToken,
} from '../services'
import { EmailService } from '../services/email-service'

export interface AccountsModule {
  // GET /me
  getRegistration(authToken: AuthToken | null): Promise<HttpResponse>

  // POST /login
  startEmailLogin(email?: string): Promise<HttpResponse>

  // GET /login/callback
  // TODO: validate a string is passed
  finishEmailLogin(token: any): Promise<HttpResponse>

  // POST /register
  // TODO: validate body
  startRegister(options: {
    name: string
    email: string
    language: string
    country: string
    affiliation: string
  }): Promise<HttpResponse>

  // GET /register/callback
  // TODO: validate a string is passed
  finishRegister(token: any): Promise<HttpResponse>

  // DELETE /me
  unregister(token: AuthToken | null): Promise<HttpResponse>
}

export interface AccountsModuleOptions {
  jwt: JwtService
  query: QueryService
  email: EmailService
  // pg: PostgresService
  // events: EventEmitterService
}

export function createAccountsModule({
  query,
  jwt,
  email,
}: AccountsModuleOptions): AccountsModule {
  return {
    async getRegistration(authToken) {
      if (!authToken) return HttpResponse.unauthorized()

      const user = await query.getVerifiedRegistration(authToken.sub)
      if (!user) return HttpResponse.unauthorized()

      return new HttpResponse(200, { user })
    },
    async startEmailLogin(emailAddress) {
      if (
        typeof emailAddress !== 'string' ||
        !emailRegex().test(emailAddress)
      ) {
        return HttpResponse.badRequest()
      }

      // FIND registration by email ...
      const registrations = await query.findRegistrations(emailAddress)
      const verified = registrations.find((r) => r.verified)

      if (!verified) return HttpResponse.unauthorized()

      const tokenPayload: EmailLoginToken = {
        kind: 'email-login',
        sub: verified.id,
        user_roles: ['attendee'],
      }
      const signedToken = jwt.sign(tokenPayload, { expiresIn: '30m' })

      email.sendLoginEmail(verified.email, signedToken, verified.language)

      return new HttpResponse(200, { message: 'ok' })
    },
    async finishEmailLogin() {
      return HttpResponse.notImplemented()
    },
    async startRegister() {
      return HttpResponse.notImplemented()
    },
    async finishRegister() {
      return HttpResponse.notImplemented()
    },
    async unregister() {
      return HttpResponse.notImplemented()
    },
  }
}
