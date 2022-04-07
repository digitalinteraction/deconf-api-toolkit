import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'
import { AuthTokenStruct, SocketAuth } from '../lib/jwt-service'

type Context = Pick<
  DeconfBaseContext,
  'jwt' | 'registrationRepo' | 'conferenceRepo' | 'store'
>

export class AuthSockets {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async auth(socketId: string, authToken: string): Promise<void> {
    const token = this.#context.jwt.verifyToken(authToken, AuthTokenStruct)

    const registration = await this.#context.registrationRepo.getVerifiedRegistration(
      token.sub
    )
    if (!registration) throw ApiError.unauthorized()

    const interpreter = await this.#context.conferenceRepo.findInterpreter(
      registration.email
    )

    await this.#context.store.put<SocketAuth>(`auth/${socketId}`, {
      authToken: token,
      email: registration.email,
      interpreter,
    })

    await this.#context.store.setExpiry(`auth/${socketId}`, 24 * 60 * 60)
  }

  async deauth(socketId: string): Promise<void> {
    const authKey = `auth/${socketId}`

    const hasToken = await this.#context.store.retrieve<SocketAuth>(authKey)
    if (!hasToken) throw ApiError.unauthorized()

    await this.#context.store.delete(authKey)
  }
}
