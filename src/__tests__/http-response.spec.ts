import { HttpResponse } from '../http-response'

describe('constructor', () => {
  it('should create a new response with a status, body & headers', () => {
    const res = new HttpResponse(200, 'ok', { some: 'header' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual('ok')
    expect(res.headers).toEqual({ some: 'header' })
  })
})

describe('badRequest', () => {
  it('should create a http/400', () => {
    const res = HttpResponse.badRequest()
    expect(res.status).toEqual(400)
  })
})

describe('unauthorized', () => {
  it('should create a http/401', () => {
    const res = HttpResponse.unauthorized()
    expect(res.status).toEqual(401)
  })
})

describe('notFound', () => {
  it('should create a http/404', () => {
    const res = HttpResponse.notFound()
    expect(res.status).toEqual(404)
  })
})

describe('internalServerError', () => {
  it('should create a http/500', () => {
    const res = HttpResponse.internalServerError()
    expect(res.status).toEqual(500)
  })
})

describe('notImplemented', () => {
  it('should create a http/501', () => {
    const res = HttpResponse.notImplemented()
    expect(res.status).toEqual(501)
  })
})
