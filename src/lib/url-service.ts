import { DeconfBaseContext } from './context'

export type Context = Pick<DeconfBaseContext, 'env'>

export class UrlService {
  get #env() {
    return this.#context.env
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  getSessionLink(sessionId: string) {
    return new URL(`session/${sessionId}`, this.#env.CLIENT_URL)
  }
  getClientLoginLink(token: string) {
    return new URL(`login/${token}`, this.#env.CLIENT_URL)
  }
}
