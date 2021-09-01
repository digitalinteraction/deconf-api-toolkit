import {
  AuthToken,
  EmailLoginToken,
  Registration,
} from '@openlab/deconf-shared'
import emailRegex from 'email-regex'
import { is, literal, number, object, refine, string } from 'superstruct'

import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'
import { EmailLoginTokenStruct } from '../lib/jwt-service'

export const RESOURCE_LOGIN_EMAIL = 'auth/login-email.mustache'
const LOGIN_EMAIL_SUBJECT = 'auth.loginEmailSubject'

interface NewRegistration {
  name: string
  email: string
  language: string
  country: string
  affiliation: string
}

// TODO: move to deconf-shared
export interface VerifyToken {
  kind: 'verify'
  sub: number
}

export interface RegistrationMailer {
  sendLoginEmail(registration: Registration, token: string): Promise<void>
  sendVerifyEmail(registration: Registration, token: string): Promise<void>
}

export enum LoginResponse {
  badRequest,
  unauthorized,
}

const LoginBodyStruct = object({
  email: refine(string(), 'email address', (value) => emailRegex().test(value)),
})

const RegisterBodyStruct = object({
  name: string(),
  email: string(),
  language: string(),
  country: string(),
  affiliation: string(),
})

const VerifyTokenStruct = object({
  kind: literal('verify'),
  sub: number(),
})

//
// NOTE - this is a non-standard DI context
//
type Context = Pick<
  DeconfBaseContext,
  'jwt' | 'registrationRepo' | 'conferenceRepo' | 'config' | 'url'
> & {
  mailer: RegistrationMailer
}

export class RegistrationRoutes {
  get #jwt() {
    return this.#context.jwt
  }
  get #conferenceRepo() {
    return this.#context.conferenceRepo
  }
  get #registrationRepo() {
    return this.#context.registrationRepo
  }
  get #config() {
    return this.#context.config
  }
  get #url() {
    return this.#context.url
  }
  get #mailer() {
    return this.#context.mailer
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context

    // if (this.#loginTemplate) {
    //   throw new Error(`Missing resource: ${RESOURCE_LOGIN_EMAIL}`)
    // }
  }

  async #getRoles(registration: Registration) {
    const cleanEmail = registration.email.toLowerCase()
    const roles = ['attendee']

    const interpreter = await this.#conferenceRepo.findInterpreter(cleanEmail)
    if (interpreter) roles.push('interpreter')

    const isAdmin = this.#config.admins.some(
      (a) => a.email.toLowerCase() === cleanEmail
    )
    if (isAdmin) roles.push('admin')

    return roles
  }

  async getRegistration(authToken: AuthToken | null) {
    if (!authToken) throw ApiError.unauthorized()

    const user = this.#registrationRepo.getVerifiedRegistration(authToken.sub)
    if (!user) throw ApiError.unauthorized()
    return user
  }

  async startEmailLogin(body: any) {
    if (!is(body, LoginBodyStruct)) throw ApiError.badRequest()

    // Make sure they have a verified record
    // TODO: a query for registations based on email not just id
    const allRegistrations = await this.#registrationRepo.getRegistrations(
      body.email
    )
    const registration = allRegistrations.find((r) => r.verified)
    if (!registration) throw ApiError.unauthorized()

    // Sign an email-login token for the user
    const signedToken = this.#jwt.signToken<EmailLoginToken>(
      { kind: 'email-login', sub: registration.id, user_roles: [] },
      { expiresIn: '30m' }
    )

    // Email the user their login token
    await this.#mailer.sendLoginEmail(registration, signedToken)
  }

  async finishEmailLogin(rawToken: any) {
    const token = this.#jwt.verifyToken(rawToken, EmailLoginTokenStruct)

    const registration = await this.#registrationRepo.getVerifiedRegistration(
      token.sub
    )
    if (!registration) throw ApiError.unauthorized()

    const authToken: AuthToken = {
      kind: 'auth',
      sub: token.sub,
      user_lang: registration.language,
      user_roles: await this.#getRoles(registration),
    }

    return this.#url.getClientLoginLink(this.#jwt.signToken(authToken))
  }

  async startRegister(body: any) {
    if (!is(body, RegisterBodyStruct)) throw ApiError.badRequest()

    await this.#registrationRepo.register(body)
    const allRegistrations = await this.#registrationRepo.getRegistrations(
      body.email
    )
    const registration = allRegistrations[allRegistrations.length - 1]
    if (!registration) throw ApiError.internalServerError()

    // Lives forever but can only be used once
    const verifyToken = this.#jwt.signToken<VerifyToken>({
      kind: 'verify',
      sub: registration.id,
    })

    await this.#mailer.sendVerifyEmail(registration, verifyToken)
  }

  async finishRegister(rawToken: any) {
    const token = this.#jwt.verifyToken(rawToken, VerifyTokenStruct)

    // If already verified exit early
    const previousReg = await this.#registrationRepo.getVerifiedRegistration(
      token.sub
    )
    if (previousReg) throw ApiError.badRequest()

    // Verify the user
    await this.#registrationRepo.verifyRegistration(token.sub)

    const registration = await this.#registrationRepo.getVerifiedRegistration(
      token.sub
    )
    if (!registration) throw ApiError.internalServerError()

    const authToken = this.#jwt.signToken<AuthToken>({
      kind: 'auth',
      sub: registration.id,
      user_lang: registration.language,
      user_roles: await this.#getRoles(registration),
    })

    return this.#url.getClientLoginLink(authToken)
  }

  async unregister(authToken: AuthToken | null) {
    if (!authToken) throw ApiError.unauthorized()

    const registration = await this.#registrationRepo.getVerifiedRegistration(
      authToken.sub
    )
    if (!registration) throw ApiError.unauthorized()

    await this.#registrationRepo.unregister(registration.email)
  }
}
