import { AuthToken } from '@openlab/deconf-shared'
import { createDebug, DeconfBaseContext } from '../lib/module'

const debug = createDebug('deconf:registration:dev-auth')

export interface DevAuthCommandOptions {
  email: string
  interpreter: boolean
  admin: boolean
}

type Context = Pick<DeconfBaseContext, 'jwt' | 'url' | 'registrationRepo'>

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
