import { DeconfEnv } from './env.js'

export type Context = {
  env: Pick<DeconfEnv, 'CLIENT_URL' | 'SELF_URL'>
}

export class UrlService {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  getSessionLink(sessionId: string) {
    return new URL(`session/${sessionId}`, this.#context.env.CLIENT_URL)
  }
  getClientLoginLink(token: string) {
    return new URL(`login/${token}`, this.#context.env.CLIENT_URL)
  }
}
