import { I18nService } from '../i18n-service'

export function mockI18nService(): I18nService {
  return {
    translate: jest.fn(),
  }
}
