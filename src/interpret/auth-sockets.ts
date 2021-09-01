import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'
import { AuthTokenStruct, SocketAuth } from '../lib/jwt-service'

//
// TODO: testing this
//

type Context = Pick<
  DeconfBaseContext,
  'jwt' | 'registrationRepo' | 'conferenceRepo' | 'store'
>

export class AuthSockets {
  get #jwt() {
    return this.#context.jwt
  }
  get #registrationRepo() {
    return this.#context.registrationRepo
  }
  get #conferenceRepo() {
    return this.#context.conferenceRepo
  }
  get #store() {
    return this.#context.store
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async auth(socketId: string, authToken: string) {
    const token = this.#jwt.verifyToken(authToken, AuthTokenStruct)

    const registration = await this.#registrationRepo.getVerifiedRegistration(
      token.sub
    )
    if (!registration) throw ApiError.unauthorized()

    const interpreter = await this.#conferenceRepo.findInterpreter(
      registration.email
    )

    await this.#store.put<SocketAuth>(`auth/${socketId}`, {
      authToken: token,
      email: registration.email,
      interpreter,
    })
  }

  async deauth(socketId: string) {
    const authKey = `auth/${socketId}`

    const hasToken = await this.#store.retrieve<SocketAuth>(authKey)
    if (!hasToken) throw ApiError.unauthorized()

    await this.#store.delete(authKey)
  }
}
