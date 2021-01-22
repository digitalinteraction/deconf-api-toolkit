import { UrlService } from '../url-service'

export function mockUrlService(): UrlService {
  return {
    getSessionLink: jest.fn(),
  }
}
