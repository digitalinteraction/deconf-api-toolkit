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
} from '../lib/module.js'

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
  config?: {
    admins: DeconfBaseContext['config']['admins']
  }

  mailer: RegistrationMailer
  userDataStruct: Describe<T>
  admins?: Array<{ email: string }>
}

/**
 * A set of endpoints to handle registration, verification and email-based login.
 * It has two extension points, one to send emails however you'd like
 * and another to for custom `userData` validation.
 *
 * The `mailer` dependency needs to implement `RegistrationMailer`
 * which is an interface for sending the emails RegistrationRoutes requires.
 *
 * ```ts
 * const mailer: RegistrationMailer = {
 *   async sendLoginEmail(registration: Registration, token: string) {
 *     // Generate and send login email
 *     // The user should be directed to the login endpoint with this token
 *   },
 *   async sendVerifyEmail(registration: Registration, token: string) {
 *     // Generate and send verification email
 *     // The user should be directed to the verify endpoint with this token
 *   },
 *   async sendAlreadyRegisteredEmail(registration: Registration, token: string) {
 *     // Generate and send an 'already registered' email,
 *     // to alert the user someone tried to re-register with their email.
 *     // Includes a login token to bypass the need to sign in again
 *     // if that was their intention
 *   },
 * }
 * ```
 *
 * The `userDataStruct` is a custom
 * [superstruct](https://github.com/ianstormtaylor/superstruct)
 * structure to validate what is stored in the `userData` on each registration record.
 *
 * ```ts
 * const userDataStruct = object({
 *   marketingConsent: boolean(),
 * })
 * ```
 *
 * Create a `RegistrationRoutes` like this:
 *
 * ```ts
 * const jwt: JwtService
 * const registrationRepo: RegistrationRepository
 * const conferenceRepo: ConferenceRepository
 * const admins: Array<{ email: string }>
 * const url: UrlService
 *
 * const app = express().use(express.json())
 *
 * const routes = new RegistrationRoutes({
 *   jwt,
 *   registrationRepo,
 *   conferenceRepo,
 *   url,
 *   mailer,
 *   userDataStruct,
 * })
 * ```
 */
export class RegistrationRoutes<T extends Record<string, unknown>> {
  #context: Context<T>
  constructor(context: Context<T>) {
    this.#context = context
  }

  // TODO: remove once deprecated
  #getAdmins() {
    return this.#context.admins ?? this.#context.config?.admins ?? []
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

  /**
   * Get the registration associated with an authentication token.
   *
   * ```ts
   * app.get('/auth/me', async (req, res) => {
   *   const token = jwt.getRequestAuth(req.headers)
   *   ctx.body = await this.#routes.getRegistration(token)
   * })
   * ```
   */
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

  /**
   * Start an email-based login. Send the user an email with a link in it which logs them in.
   *
   * ```ts
   * app.post('/auth/login', async (req, res) => {
   *   res.send(await routes.startEmailLogin(req.body))
   * })
   * ```
   *
   * Where the request body is:
   *
   * ```json
   * {
   *   "email": "geoff@example.com"
   * }
   * ```
   */
  async startEmailLogin(body: unknown): Promise<VoidResponse> {
    assertStruct(body, LoginBodyStruct)

    // Make sure they have a verified record
    const allRegistrations =
      await this.#context.registrationRepo.getRegistrations(body.email)
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

  /**
   * The endpoint that is triggered by a user clicking a login link in an email.
   * It validates the token and redirects the user to the client to finish logging in.
   *
   * ```ts
   * app.get('/auth/login/:token', (req, res) => {
   *   const url = await this.#routes.finishEmailLogin(req.params.token)
   *   res.redirect(url.toString())
   * })
   * ```
   */
  async finishEmailLogin(rawToken: any): Promise<URL> {
    const token = this.#context.jwt.verifyToken(rawToken, EmailLoginTokenStruct)

    const registration =
      await this.#context.registrationRepo.getVerifiedRegistration(token.sub)
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

  /**
   * Start off a new registration.
   *
   * ```ts
   * app.post('/auth/register', async (req, res) => {
   *   res.send(await routes.startRegister(req.body))
   * })
   * ```
   *
   * Where the body is:
   *
   * ```json
   * {
   *   "name": "Chloe Smith",
   *   "email": "chloe@example.com",
   *   "language": "en",
   *   "country": "GB",
   *   "affiliation": "Open Lab",
   *   "userData": {
   *     "marketingConsent": false
   *   }
   * }
   * ```
   *
   * > Where `userData` matches whatever your `userDataStruct` requires.
   */
  async startRegister(rawBody: Record<string, unknown>): Promise<VoidResponse> {
    // A bit of a hack to assert two structs
    // I couldn't get it to work with superstruct#assign
    const { userData, ...rest } = rawBody
    assertStruct(rest, RegisterBodyStruct)
    assertStruct(userData, this.#context.userDataStruct)
    const body = { ...rest, userData }

    let allRegistrations =
      await this.#context.registrationRepo.getRegistrations(body.email)

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

  /**
   * Finish the registration process, verify the registration record
   * and log the user in.
   * `token` should come from the email the user was sent from `startRegister`.
   *
   * The user can on verify a registration once and this will fail if they attempt to re-verify their registration.
   * This is to make verify emails single-use as they log the user in.
   *
   * ```ts
   * app.get('/auth/register/:token', async (req, res) => {
   *   const url = await routes.finishRegister(token)
   *   res.redirect(url.toString())
   * })
   * ```
   */
  async finishRegister(rawToken: any): Promise<URL> {
    const token = this.#context.jwt.verifyToken(rawToken, VerifyTokenStruct)

    // If already verified exit early
    const previousReg =
      await this.#context.registrationRepo.getVerifiedRegistration(token.sub)
    if (previousReg) {
      throw new ApiError(400, ['registration.alreadyVerified'])
    }

    // Verify the user
    await this.#context.registrationRepo.verifyRegistration(token.sub)

    const registration =
      await this.#context.registrationRepo.getVerifiedRegistration(token.sub)
    if (!registration) throw ApiError.internalServerError()

    const authToken = this.#context.jwt.signToken<AuthToken>({
      kind: 'auth',
      sub: registration.id,
      user_lang: registration.language,
      user_roles: await this.#getRoles(registration),
    })

    return this.#context.url.getClientLoginLink(authToken)
  }

  /**
   * Remove all registrations relating to an email address.
   * This requires the user with that email to be signed in.
   * `token` should be a valid authentication token from a login/verify.
   *
   * ```ts
   * app.del('/auth/me', async (req, res) => {
   *   const token = jwt.getRequestAuth(req.headers)
   *   res.send(await this.#routes.unregister(token))
   * })
   * ```
   */
  async unregister(authToken: AuthToken | null): Promise<VoidResponse> {
    if (!authToken) throw ApiError.unauthorized()

    const registration =
      await this.#context.registrationRepo.getVerifiedRegistration(
        authToken.sub
      )
    if (!registration) throw ApiError.unauthorized()

    await this.#context.registrationRepo.unregister(registration.email)

    return VOID_RESPONSE
  }
}
