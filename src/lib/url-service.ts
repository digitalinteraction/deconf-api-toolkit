import { DeconfBaseContext } from './context'

// export interface UrlService {
//   getSessionLink(sessionId: string): URL
// }

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
    return new URL(`session/${sessionId}`, this.#env.SELF_URL)
  }
}
