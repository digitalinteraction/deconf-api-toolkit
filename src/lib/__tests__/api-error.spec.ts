import { ApiError } from '../api-error.js'

describe('ApiError', () => {
  describe('.badRequest', () => {
    it('should create a 400 error', () => {
      const result = ApiError.badRequest()

      expect(result.status).toEqual(400)
      expect(result.codes).toEqual(['general.badRequest'])
    })
  })
  describe('.unauthorized', () => {
    it('should create a 401 error', () => {
      const result = ApiError.unauthorized()

      expect(result.status).toEqual(401)
      expect(result.codes).toEqual(['general.unauthorized'])
    })
  })
  describe('.notFound', () => {
    it('should create a 404 error', () => {
      const result = ApiError.notFound()

      expect(result.status).toEqual(404)
      expect(result.codes).toEqual(['general.notFound'])
    })
  })
  describe('.internalServerError', () => {
    it('should create a 500 error', () => {
      const result = ApiError.internalServerError()

      expect(result.status).toEqual(500)
      expect(result.codes).toEqual(['general.internalServerError'])
    })
  })
})
