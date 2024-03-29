import { assert as assertStruct, literal, number, type } from 'superstruct'
import jsonwebtoken from 'jsonwebtoken'

import { mockKeyValueStore } from '../../test-lib/mocks.js'
import { createTestingEnv } from '../env.js'
import {
  AuthTokenStruct,
  AuthzHeadersStruct,
  EmailLoginTokenStruct,
  JwtService,
} from '../jwt-service.js'
import { ApiError } from '../api-error.js'
import { createTestingDeconfConfig } from '../config.js'

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
    const config = createTestingDeconfConfig()
    const service = new JwtService({ env, store, config })
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
        iss: 'deconf-test-app',
        iat: expect.any(Number),
      })
    })
  })

  describe('#verifyToken', () => {
    it('should verify the token with the struct', () => {
      const { service, env } = setup()
      const token = jsonwebtoken.sign(
        {
          kind: 'test_token',
          sub: 1,
          iss: 'deconf-test-app',
        },
        env.JWT_SECRET
      )
      const struct = type({
        kind: literal('test_token'),
        sub: number(),
      })

      const exec = () => service.verifyToken(token, struct)

      expect(exec).not.toThrow()
    })
    it('should throw a badRequest if the structure is invalid', () => {
      const { service, env } = setup()
      const token = jsonwebtoken.sign(
        {
          kind: 'test_token',
          iss: 'deconf-test-app',
        },
        env.JWT_SECRET
      )
      const struct = type({
        kind: literal('test_token'),
        sub: number(),
      })

      const exec = () => service.verifyToken(token, struct)

      expect(exec).toThrow(ApiError)
    })
  })

  describe('#getSocketAuth', () => {
    it('should retrieve the auth from the store', async () => {
      const { service, store } = setup()
      store.data.set('auth/abcdef', 'mock_token')

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
          iss: 'deconf-test-app',
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
        iss: 'deconf-test-app',
        iat: expect.any(Number),
      })
    })
  })
})
