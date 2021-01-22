import { createUrlService } from '../url-service'

function setup() {
  const service = createUrlService(
    'http://localhost:3000/api/',
    'http://localhost:8080/'
  )
  return { service }
}

describe('getSessionLink', () => {
  it('should generate a url for the API', () => {
    const { service } = setup()

    const result = service.getSessionLink('intro-to-games')

    expect(result.toString()).toEqual(
      'http://localhost:8080/session/intro-to-games'
    )
  })
})
