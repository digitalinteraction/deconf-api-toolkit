import { AuthToken } from '@openlab/deconf-shared'
import { createAuthenticationService } from '../authentication-service'

function setup() {
  const token: AuthToken = {
    kind: 'auth',
    sub: 123,
    user_roles: ['attendee'],
    user_lang: 'en-gb',
  }

  const lookup = jest.fn()
  const verifyToken = jest.fn()

  const service = createAuthenticationService(lookup, verifyToken)

  return { lookup, verifyToken, service, token }
}

describe('fromSocketId', () => {
  it('should get the auth from redis', async () => {
    const { service, lookup, token } = setup()
    lookup.mockResolvedValue(token)

    await service.fromSocketId('socket_id')

    expect(lookup).toBeCalledWith('auth_socket_id')
  })
  it('should return the token from redis', async () => {
    const { service, lookup, token } = setup()
    lookup.mockResolvedValue(token)

    const auth = await service.fromSocketId('socket_id')

    expect(auth).toEqual({
      kind: 'auth',
      sub: 123,
      user_roles: ['attendee'],
      user_lang: 'en-gb',
    })
  })
})

describe('fromRequestHeaders', () => {
  it('should verify the jwt', async () => {
    const { service, verifyToken, token } = setup()
    verifyToken.mockReturnValue(token)

    const authorization = 'bearer abcdefgh'
    await service.fromRequestHeaders({ authorization })

    expect(verifyToken).toBeCalledWith('abcdefgh')
  })
  it('should return the jwt', async () => {
    const { service, verifyToken, token } = setup()
    verifyToken.mockReturnValue(token)

    const auth = await service.fromRequestHeaders({
      authorization: 'bearer abcdefgh',
    })

    expect(auth).toEqual({
      kind: 'auth',
      sub: 123,
      user_roles: ['attendee'],
      user_lang: 'en-gb',
    })
  })
  it("should null if the jwt isn't an object", async () => {
    const { service, verifyToken } = setup()
    verifyToken.mockReturnValue('not_an_object')

    const result = await service.fromRequestHeaders({
      authorization: 'bearer abcdefgh',
    })

    expect(result).toEqual(null)
  })
  it('should return null if the verification fails', async () => {
    const { service, verifyToken } = setup()
    verifyToken.mockImplementation(() => {
      throw new Error('Something went wrong')
    })

    const result = await service.fromRequestHeaders({
      authorization: 'bearer abcdefgh',
    })

    expect(result).toEqual(null)
  })
})
