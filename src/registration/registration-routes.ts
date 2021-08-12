import {
  AuthToken,
  EmailLoginToken,
  Registration,
} from '@openlab/deconf-shared'
import emailRegex from 'email-regex'
import mustache from 'mustache'

import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'

export const RESOURCE_LOGIN_EMAIL = 'auth/login-email.mustache'
const LOGIN_EMAIL_SUBJECT = 'auth.loginEmailSubject'

interface NewRegistration {
  name: string
  email: string
  language: string
  country: string
  affiliation: string
}

export enum LoginResponse {
  badRequest,
  unauthorized,
}

type Context = Pick<
  DeconfBaseContext,
  'jwt' | 'registrationRepo' | 'email' | 'resources' | 'i18n'
>

export class RegistrationRoutes {
  get #jwt() {
    return this.#context.jwt
  }
  get #registrationRepo() {
    return this.#context.registrationRepo
  }
  get #email() {
    return this.#context.email
  }
  get #i18n() {
    return this.#context.i18n
  }
  get #loginTemplate() {
    return this.#context.resources.get(RESOURCE_LOGIN_EMAIL)?.toString('utf8')!
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context

    if (this.#loginTemplate) {
      throw new Error(`Missing resource: ${RESOURCE_LOGIN_EMAIL}`)
    }
  }

  async getRegistration(authToken: AuthToken | null) {
    if (!authToken) return null

    return this.#registrationRepo.getVerifiedRegistration(authToken.sub)
  }

  async startEmailLogin(emailAddress: string) {
    if (typeof emailAddress !== 'string' || !emailRegex().test(emailAddress)) {
      throw ApiError.badRequest()
    }

    // FIND registration by email ...
    const registrations = await this.#registrationRepo.findRegistrations(
      emailAddress
    )
    const verified = registrations.find((r) => r.verified)

    if (!verified) throw ApiError.unauthorized()

    const tokenPayload: EmailLoginToken = {
      kind: 'email-login',
      sub: verified.id,
      user_roles: ['attendee'],
    }
    const signedToken = this.#jwt.signToken(tokenPayload, { expiresIn: '30m' })

    // this.#email.sendLoginEmail(verified.email, signedToken, verified.language)
    const subject = this.#i18n.translate(verified.language, LOGIN_EMAIL_SUBJECT)
    const html = mustache.render(this.#loginTemplate, {
      token: signedToken,
      locale: verified.language,
    })
    await this.#email.sendEmail(verified.email, subject, html)
  }

  finishEmailLogin(token: any) {
    throw new Error('TODO: Not implemented')
  }

  startRegister(options: NewRegistration) {
    throw new Error('TODO: Not implemented')
  }

  finishRegister(token: any) {
    throw new Error('TODO: Not implemented')
  }

  unregister(token: AuthToken | null) {
    throw new Error('TODO: Not implemented')
  }
}
