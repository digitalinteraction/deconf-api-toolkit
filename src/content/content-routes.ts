import { Localised } from '@openlab/deconf-shared'
import { DeconfBaseContext } from '../lib/module'

type Context = Pick<DeconfBaseContext, 'store'>

export class ContentRoutes {
  #context: Context

  constructor(context: Context) {
    this.#context = context
  }

  // GET /content/:slug
  async getContent(slug: string) {
    return this.#context.store.retrieve<Localised>(`content.${slug}`)
  }
}
