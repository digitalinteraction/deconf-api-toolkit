import { getI18nKeys, I18nService, loadI18nLocales } from '../i18n-service.js'
import { ResourcesMap } from '../resources.js'

describe('#getI18nKeys', () => {
  it('should return the dot-notation keys on an object', () => {
    const result = getI18nKeys({
      test: {
        simple: 'Hello, world!',
      },
    })

    expect(result).toEqual(['test.simple'])
  })
})

describe('#loadI18nLocales', () => {
  it('should load the matching yaml files', async () => {
    const resources: ResourcesMap = new Map([
      ['i18n/en.yml', Buffer.from('{ message: "Hello" }', 'utf8')],
      ['i18n/fr.yml', Buffer.from('{ message: "Bonjour" }', 'utf8')],
    ])

    const locales = loadI18nLocales(resources, ['en', 'fr'])

    expect(locales).toEqual({
      en: { message: 'Hello' },
      fr: { message: 'Bonjour' },
    })
  })
})

describe('I18nService', () => {
  describe('.findMissingKeys', () => {
    it('should return missing keys', () => {
      const result = I18nService.findMissingKeys({
        en: {
          test: {
            simple: 'Hello, world',
          },
        },
        fr: {},
      })

      expect(result).toEqual({
        en: [],
        fr: ['test.simple'],
      })
    })
  })

  describe('.loadLocales', () => {
    it('should load the yaml files in a directory', async () => {
      const dir = new URL('../../test-lib/test-i18n', import.meta.url)
      const locales = await I18nService.loadLocales(dir.pathname)

      expect(locales).toEqual({
        en: {
          test: {
            simple: expect.any(String),
            substituted: expect.any(String),
          },
        },
        fr: {
          test: {
            simple: expect.any(String),
          },
        },
      })
    })
  })

  describe('#translate', () => {
    function setup() {
      const service = new I18nService({
        en: {
          test: {
            simple: 'Hello, world!',
            substituted: 'Hello, {{ name }}!',
          },
        },
        fr: {
          test: {
            simple: 'Bonjour le monde!',
          },
        },
        es: {},
      })
      return { service }
    }

    it('should perform simple translations', () => {
      const { service } = setup()

      const result = service.translate('en', 'test.simple')
      expect(result).toEqual('Hello, world!')
    })

    it('should perform simple french translations', () => {
      const { service } = setup()

      const result = service.translate('fr', 'test.simple')
      expect(result).toEqual('Bonjour le monde!')
    })

    it('should fail for unknown locales', () => {
      const { service } = setup()

      const call = () => service.translate('ru', 'test.simple')
      expect(call).toThrow(/Unknown locale/)
    })

    it('should fallback to english', () => {
      const { service } = setup()

      const result = service.translate('es', 'test.simple')
      expect(result).toEqual('Hello, world!')
    })

    it('should perform substitutions', () => {
      const { service } = setup()

      const result = service.translate('en', 'test.substituted', {
        name: 'Geoff',
      })

      expect(result).toEqual('Hello, Geoff!')
    })
  })
})
