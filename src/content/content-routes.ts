import { Localised, LocalisedContent } from '@openlab/deconf-shared'
import { ApiError, DeconfBaseContext } from '../lib/module'

type Context = Pick<DeconfBaseContext, 'store'>

export class ContentRoutes {
  #context: Context

  constructor(context: Context) {
    this.#context = context
  }

  // GET /content/:slug
  async getContent(slug: string): Promise<LocalisedContent> {
    const content = await this.#context.store.retrieve<Localised>(
      `content.${slug}`
    )
    if (!content) throw ApiError.notFound()
    return { content }
  }
}
