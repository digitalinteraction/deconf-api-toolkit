import { I18nService } from '../i18n-service'

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

describe('I18nService', () => {
  it('should ...', () => {})
})
