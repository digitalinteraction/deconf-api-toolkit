import { AuthToken } from '@openlab/deconf-shared'
import { createDebug, DeconfBaseContext } from '../lib/module.js'

const debug = createDebug('deconf:registration:dev-auth')

/** `DevAuthCommandOptions` defines options for running `DevAuthCommand`  */
export interface DevAuthCommandOptions {
  /** Force the email of the generated token */
  email: string

  /** make the token have interpreter access */
  interpreter: boolean

  /** make the token have admin access */
  admin: boolean
}

type Context = Pick<DeconfBaseContext, 'jwt' | 'url' | 'registrationRepo'>

/**
 * DevAuthCommand is a CLI command to generate a valid authentication token and sign-in URL for local development.
 *
 * ```ts
 * const jwt: JwtService
 * const url: UrlService
 * const registrationRepo: RegistrationRepository
 *
 * const command = new DevAuthCommand({ jwt, url, registrationRepo })
 *
 * const { url, token } = command.process({
 *   email: 'jess@example.com',
 *   interpreter: true,
 *   admin: false,
 * })
 *
 * console.log('Your dev token is %o', token)
 * console.log('Log in at %o', url)
 * ```
 */
export class DevAuthCommand {
  #context: Context

  constructor(context: Context) {
    this.#context = context
  }

  async process(options: DevAuthCommandOptions) {
    // Grab the user
    const registrations = await this.#context.registrationRepo.getRegistrations(
      options.email
    )
    debug(
      'registrations %o',
      registrations.map((r) => r.id)
    )
    const verifiedUser = registrations.find((r) => r.verified)

    if (!verifiedUser) {
      throw new Error(`Registration not found for "${options.email}"`)
    }

    // Generate roles
    const roles = ['attendee']
    if (options.interpreter) roles.push('interpreter')
    if (options.admin) roles.push('admin')
    debug('roles %o', roles)

    // Sign a JWT
    const token = this.#context.jwt.signToken<AuthToken>({
      kind: 'auth',
      sub: verifiedUser.id,
      user_lang: verifiedUser.language,
      user_roles: roles,
    })
    const url = this.#context.url.getClientLoginLink(token)

    return { token, url }
  }
}
