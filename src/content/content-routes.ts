import { Localised, LocalisedContent } from '@openlab/deconf-shared'
import { ApiError, DeconfBaseContext } from '../lib/module.js'

type Context = Pick<DeconfBaseContext, 'store'>

/**
 * ContentRoutes is a set of routes to retrieve content.
 * 
 * ```ts
 * const store: RedisStore
 * const contentRoutes = new ContentRoutes({ store })

 * const app = express()
 * 
 * app.get('/content/:slug', async (req, res) => {
 *   res.send(await contentRoutes.getContent(req.params.slug))
 * })
 * ```
 */
export class ContentRoutes {
  #context: Context

  constructor(context: Context) {
    this.#context = context
  }

  /**
   * This route returns localised content for a given content slug an object like below,
   * where each key you passed to `languages` above is present.
   *
   * ```json
   * {
   *   "content": {
   *     "en": "<p> The English text </p>",
   *     "fr": "<p> The French text </p>"
   *   }
   * }
   * ```
   */
  async getContent(slug: string): Promise<LocalisedContent> {
    const content = await this.#context.store.retrieve<Localised>(
      `content.${slug}`
    )
    if (!content) throw ApiError.notFound()
    return { content }
  }
}
