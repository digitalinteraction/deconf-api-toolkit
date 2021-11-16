import { mockKeyValueStore } from '../../test-lib/module'
import { ContentRoutes } from '../content-routes'

function setup() {
  const store = mockKeyValueStore()
  const routes = new ContentRoutes({ store })
  return { store, routes }
}

describe('ContentRoutes', () => {
  describe('#getContent', () => {
    it('should return the content in the store', async () => {
      const { store, routes } = setup()
      store.put('content.about', {
        en: 'About',
        fr: 'Environ',
        es: 'Acerca de',
        ar: 'عن',
      })

      const result = await routes.getContent('about')

      expect(result).toEqual({
        content: {
          en: 'About',
          fr: 'Environ',
          es: 'Acerca de',
          ar: 'عن',
        },
      })
    })
  })
})
