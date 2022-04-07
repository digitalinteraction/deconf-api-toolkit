import {
  AuthToken,
  EmailLoginToken,
  Registration,
  UserRegistration,
  VerifyToken,
} from '@openlab/deconf-shared'
import emailRegex from 'email-regex'
import { object, refine, string, Describe } from 'superstruct'

import {
  ApiError,
  assertStruct,
  DeconfBaseContext,
  EmailLoginTokenStruct,
  VerifyTokenStruct,
  VoidResponse,
  VOID_RESPONSE,
} from '../lib/module'

export interface RegistrationMailer {
  sendLoginEmail(registration: Registration, token: string): Promise<void>
  sendVerifyEmail(registration: Registration, token: string): Promise<void>
  sendAlreadyRegisteredEmail(
    registration: Registration,
    token: string
  ): Promise<void>
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

//
// NOTE - this is a non-standard DI context
//
type Context<T extends Record<string, unknown>> = Pick<
  DeconfBaseContext,
  'jwt' | 'registrationRepo' | 'conferenceRepo' | 'url'
> & {
  /** @deprecated use `admins` instead */
  config: {
    admins: DeconfBaseContext['config']['admins']
  }

  mailer: RegistrationMailer
  userDataStruct: Describe<T>
  admins?: Array<{ email: string }>
}

export class RegistrationRoutes<T extends Record<string, unknown>> {
  #context: Context<T>
  constructor(context: Context<T>) {
    this.#context = context
  }

  // TODO: remove once deprecated
  #getAdmins() {
    return this.#context.admins ?? this.#context.config.admins
  }

  async #getRoles(registration: Registration) {
    const cleanEmail = registration.email.toLowerCase()
    const roles = ['attendee']

    const interpreter = await this.#context.conferenceRepo.findInterpreter(
      cleanEmail
    )
    if (interpreter) roles.push('interpreter')

    const isAdmin = this.#getAdmins().some(
      (a) => a.email.toLowerCase() === cleanEmail
    )
    if (isAdmin) roles.push('admin')

    return roles
  }

  async getRegistration(
    authToken: AuthToken | null
  ): Promise<UserRegistration> {
    if (!authToken) throw ApiError.unauthorized()

    const user = await this.#context.registrationRepo.getVerifiedRegistration(
      authToken.sub
    )
    if (!user) throw ApiError.unauthorized()

    return { registration: user }
  }

  async startEmailLogin(body: unknown): Promise<VoidResponse> {
    assertStruct(body, LoginBodyStruct)

    // Make sure they have a verified record
    const allRegistrations = await this.#context.registrationRepo.getRegistrations(
      body.email
    )
    const registration = allRegistrations.find((r) => r.verified)
    if (!registration) throw ApiError.unauthorized()

    // Sign an email-login token for the user
    const signedToken = this.#context.jwt.signToken<EmailLoginToken>(
      { kind: 'email-login', sub: registration.id, user_roles: [] },
      { expiresIn: '30m' }
    )

    // Email the user their login token
    await this.#context.mailer.sendLoginEmail(registration, signedToken)

    return VOID_RESPONSE
  }

  async finishEmailLogin(rawToken: any): Promise<URL> {
    const token = this.#context.jwt.verifyToken(rawToken, EmailLoginTokenStruct)

    const registration = await this.#context.registrationRepo.getVerifiedRegistration(
      token.sub
    )
    if (!registration) throw ApiError.unauthorized()

    const authToken: AuthToken = {
      kind: 'auth',
      sub: token.sub,
      user_lang: registration.language,
      user_roles: await this.#getRoles(registration),
    }

    return this.#context.url.getClientLoginLink(
      this.#context.jwt.signToken(authToken)
    )
  }

  async startRegister(rawBody: Record<string, unknown>): Promise<VoidResponse> {
    // A bit of a hack to assert two structs
    // I couldn't get it to work with superstruct#assign
    const { userData, ...rest } = rawBody
    assertStruct(rest, RegisterBodyStruct)
    assertStruct(userData, this.#context.userDataStruct)
    const body = { ...rest, userData }

    let allRegistrations = await this.#context.registrationRepo.getRegistrations(
      body.email
    )

    if (allRegistrations.some((r) => r.verified)) {
      const verified = allRegistrations.find((r) => r.verified) as Registration
      const authToken = this.#context.jwt.signToken<AuthToken>({
        kind: 'auth',
        sub: verified.id,
        user_lang: verified.language,
        user_roles: await this.#getRoles(verified),
      })
      await this.#context.mailer.sendAlreadyRegisteredEmail(verified, authToken)
      return VOID_RESPONSE
    }

    await this.#context.registrationRepo.register(body)
    allRegistrations = await this.#context.registrationRepo.getRegistrations(
      body.email
    )
    const registration = allRegistrations[allRegistrations.length - 1]
    if (!registration) throw ApiError.internalServerError()

    // Lives forever but can only be used once
    const verifyToken = this.#context.jwt.signToken<VerifyToken>({
      kind: 'verify',
      sub: registration.id,
    })

    await this.#context.mailer.sendVerifyEmail(registration, verifyToken)

    return VOID_RESPONSE
  }

  async finishRegister(rawToken: any): Promise<URL> {
    const token = this.#context.jwt.verifyToken(rawToken, VerifyTokenStruct)

    // If already verified exit early
    const previousReg = await this.#context.registrationRepo.getVerifiedRegistration(
      token.sub
    )
    if (previousReg) {
      throw new ApiError(400, ['registration.alreadyVerified'])
    }

    // Verify the user
    await this.#context.registrationRepo.verifyRegistration(token.sub)

    const registration = await this.#context.registrationRepo.getVerifiedRegistration(
      token.sub
    )
    if (!registration) throw ApiError.internalServerError()

    const authToken = this.#context.jwt.signToken<AuthToken>({
      kind: 'auth',
      sub: registration.id,
      user_lang: registration.language,
      user_roles: await this.#getRoles(registration),
    })

    return this.#context.url.getClientLoginLink(authToken)
  }

  async unregister(authToken: AuthToken | null): Promise<VoidResponse> {
    if (!authToken) throw ApiError.unauthorized()

    const registration = await this.#context.registrationRepo.getVerifiedRegistration(
      authToken.sub
    )
    if (!registration) throw ApiError.unauthorized()

    await this.#context.registrationRepo.unregister(registration.email)

    return VOID_RESPONSE
  }
}
