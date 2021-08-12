import { assert as assertStruct } from 'superstruct'
import jsonwebtoken from 'jsonwebtoken'

import { mockKeyValueStore } from '../../test-lib/mocks'
import { createTestingEnv } from '../env'
import {
  AuthTokenStruct,
  AuthzHeadersStruct,
  EmailLoginTokenStruct,
  JwtService,
  JWT_ISSUER,
} from '../jwt-service'

describe('AuthzHeadersStruct', () => {
  it('should validate auth headers', () => {
    const input = {
      authorization: 'bearer abcdef',
    }
    assertStruct(input, AuthzHeadersStruct)
  })
})

describe('AuthTokenStruct', () => {
  it('should validate auth headers', () => {
    const input = {
      kind: 'auth',
      sub: 1,
      user_roles: ['admin'],
      user_lang: 'en',
    }
    assertStruct(input, AuthTokenStruct)
  })
})

describe('EmailLoginTokenStruct', () => {
  it('should validate auth headers', () => {
    const input = {
      kind: 'email-login',
      sub: 1,
      user_roles: ['admin'],
    }
    assertStruct(input, EmailLoginTokenStruct)
  })
})

describe('JwtService', () => {
  function setup() {
    const env = createTestingEnv()
    const store = mockKeyValueStore()
    const service = new JwtService({ env, store })
    return { service, env, store }
  }

  describe('#signToken', () => {
    it('should sign the token with an issuer', () => {
      const { service, env } = setup()

      const result = service.signToken({
        kind: 'auth',
        sub: 1,
        user_roles: ['admin'],
        user_lang: 'en',
      })

      const decoded = jsonwebtoken.verify(result, env.JWT_SECRET)

      expect(decoded).toEqual({
        kind: 'auth',
        sub: 1,
        user_roles: ['admin'],
        user_lang: 'en',
        iss: JWT_ISSUER,
        iat: expect.any(Number),
      })
    })
  })

  describe('#verifyAuthToken', () => {
    it('should verify the token', () => {
      const { service, env } = setup()
      const token = jsonwebtoken.sign(
        {
          kind: 'auth',
          sub: 1,
          user_roles: ['admin'],
          user_lang: 'en',
          iss: JWT_ISSUER,
        },
        env.JWT_SECRET
      )

      const exec = () => service.verifyAuthToken(token)

      expect(exec).not.toThrow()
    })
  })

  describe('#verifyEmailLoginToken', () => {
    it('should verify the token', () => {
      const { service, env } = setup()
      const token = jsonwebtoken.sign(
        {
          kind: 'email-login',
          sub: 1,
          user_roles: ['admin'],
          iss: JWT_ISSUER,
        },
        env.JWT_SECRET
      )

      const exec = () => service.verifyEmailLoginToken(token)

      expect(exec).not.toThrow()
    })
  })

  describe('#getSocketAuth', () => {
    it('should retrieve the auth from the store', async () => {
      const { service, store } = setup()
      store.data.set('auth_abcdef', 'mock_token')

      const result = await service.getSocketAuth('abcdef')

      expect(result).toEqual('mock_token')
    })
  })

  describe('#getRequestAuth', () => {
    it('should decode the JWT from headers', () => {
      const { service, env } = setup()
      const token = jsonwebtoken.sign(
        {
          kind: 'auth',
          sub: 1,
          user_roles: ['admin'],
          user_lang: 'en',
          iss: JWT_ISSUER,
        },
        env.JWT_SECRET
      )

      const result = service.getRequestAuth({
        authorization: `bearer ${token}`,
      })

      expect(result).toEqual({
        kind: 'auth',
        sub: 1,
        user_roles: ['admin'],
        user_lang: 'en',
        iss: JWT_ISSUER,
        iat: expect.any(Number),
      })
    })
  })
})
