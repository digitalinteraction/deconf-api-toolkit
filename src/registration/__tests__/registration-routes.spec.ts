import { mocked } from 'ts-jest/utils'
import { createTestingDeconfConfig } from '../../lib/config'
import {
  mockAuthToken,
  mockEmailLoginToken,
  mockInterpreter,
  mockRegistration,
  mockVerifyToken,
  VOID_RESPONSE,
} from '../../test-lib/module'
import {
  mockConferenceRepository,
  mockJwtService,
  mockRegistrationRepository,
  mockUrlService,
} from '../../test-lib/mocks'
import { RegistrationRoutes } from '../registration-routes'
import { object, string } from 'superstruct'

function setup() {
  const url = mockUrlService()
  const conferenceRepo = mockConferenceRepository()
  const jwt = mockJwtService()
  const registrationRepo = mockRegistrationRepository()
  const config = createTestingDeconfConfig()
  const mailer = {
    sendLoginEmail: jest.fn(),
    sendVerifyEmail: jest.fn(),
    sendAlreadyRegisteredEmail: jest.fn(),
  }
  const userDataStruct = object({
    favouritePizza: string(),
  })
  const routes = new RegistrationRoutes({
    conferenceRepo,
    config,
    jwt,
    registrationRepo,
    url,
    mailer,
    userDataStruct,
  })
  return { routes, conferenceRepo, config, jwt, registrationRepo, url, mailer }
}

describe('RegistrationRoutes', () => {
  describe('getRegistration', () => {
    it('should return the users verification', async () => {
      const { routes, registrationRepo } = setup()
      const authToken = mockAuthToken({ sub: 1 })
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValue(
        mockRegistration({ email: 'geoff@example.com' })
      )

      const result = await routes.getRegistration(authToken)

      expect(result).toEqual({
        registration: expect.objectContaining({
          email: 'geoff@example.com',
        }),
      })
    })
  })

  describe('#startEmailLogin', () => {
    it('should send a login email', async () => {
      const { routes, registrationRepo, jwt, mailer } = setup()
      mocked(registrationRepo.getRegistrations).mockResolvedValue([
        mockRegistration({ email: 'geoff@example.com', verified: true }),
      ])
      mocked(jwt.signToken).mockReturnValue('mock_token')

      await routes.startEmailLogin({
        email: 'geoff@example.com',
      })

      expect(mailer.sendLoginEmail).toBeCalledWith(
        expect.objectContaining({ email: 'geoff@example.com' }),
        'mock_token'
      )
    })
    it('should return a VOID_RESPONSE', async () => {
      const { routes, registrationRepo, jwt, mailer } = setup()
      mocked(registrationRepo.getRegistrations).mockResolvedValue([
        mockRegistration({ email: 'geoff@example.com', verified: true }),
      ])
      mocked(jwt.signToken).mockReturnValue('mock_token')

      const result = await routes.startEmailLogin({
        email: 'geoff@example.com',
      })

      expect(result).toEqual(VOID_RESPONSE)
    })
  })

  describe('#finishEmailLogin', () => {
    it('should return a login link', async () => {
      const { routes, registrationRepo, jwt, url, conferenceRepo } = setup()
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValue(
        mockRegistration({ email: 'jess@example.com' })
      )
      mocked(jwt.verifyToken).mockReturnValue(mockEmailLoginToken())
      mocked(jwt.signToken).mockReturnValue('mock_login_token')
      mocked(conferenceRepo.findInterpreter).mockResolvedValue(null)
      mocked(url.getClientLoginLink).mockImplementation(
        (token) => new URL(`http://localhost#${token}`)
      )

      const result = await routes.finishEmailLogin('mock_email_token')

      expect(result).toEqual(new URL('http://localhost#mock_login_token'))
    })
    it('should add interpret and admin roles', async () => {
      const { routes, registrationRepo, jwt, url, conferenceRepo } = setup()
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValue(
        mockRegistration({ id: 1, email: 'geoff@example.com', language: 'fr' })
      )
      mocked(jwt.verifyToken).mockReturnValue(mockEmailLoginToken())
      mocked(jwt.signToken).mockReturnValue('mock_login_token')
      mocked(conferenceRepo.findInterpreter).mockResolvedValue(
        mockInterpreter({ email: 'geoff@example.com' })
      )
      mocked(url.getClientLoginLink).mockImplementation(
        (token) => new URL(`http://localhost#${token}`)
      )

      await routes.finishEmailLogin('mock_email_token')

      expect(jwt.signToken).toBeCalledWith({
        kind: 'auth',
        sub: 1,
        user_lang: 'fr',
        user_roles: ['attendee', 'interpreter', 'admin'],
      })
    })
  })

  describe('#startRegister', () => {
    it('should send a verification email', async () => {
      const { routes, registrationRepo, jwt, mailer } = setup()
      mocked(registrationRepo.getRegistrations).mockResolvedValue([
        mockRegistration({ email: 'tim@example.com', verified: false }),
      ])
      mocked(jwt.signToken).mockReturnValue('mock_verify_token')

      await routes.startRegister({
        name: 'Tim Smith',
        email: 'tim@example.com',
        language: 'fr',
        country: 'FR',
        affiliation: 'Open Lab',
        userData: {
          favouritePizza: 'Pepperoni',
        },
      })

      expect(mailer.sendVerifyEmail).toBeCalledWith(
        expect.objectContaining({ email: 'tim@example.com' }),
        'mock_verify_token'
      )
    })
    it('should register the user', async () => {
      const { routes, registrationRepo, jwt, mailer } = setup()
      mocked(registrationRepo.getRegistrations).mockResolvedValue([
        mockRegistration({ email: 'tim@example.com', verified: false }),
      ])
      mocked(jwt.signToken).mockReturnValue('mock_verify_token')

      await routes.startRegister({
        name: 'Tim Smith',
        email: 'tim@example.com',
        language: 'fr',
        country: 'FR',
        affiliation: 'Open Lab',
        userData: {
          favouritePizza: 'Pepperoni',
        },
      })

      expect(registrationRepo.register).toBeCalledWith({
        name: 'Tim Smith',
        email: 'tim@example.com',
        language: 'fr',
        country: 'FR',
        affiliation: 'Open Lab',
        userData: {
          favouritePizza: 'Pepperoni',
        },
      })
    })
    it('should return a VOID_RESPONSE', async () => {
      const { routes, registrationRepo, jwt, mailer } = setup()
      mocked(registrationRepo.getRegistrations).mockResolvedValue([
        mockRegistration({ email: 'tim@example.com', verified: false }),
      ])
      mocked(jwt.signToken).mockReturnValue('mock_verify_token')

      const result = await routes.startRegister({
        name: 'Tim Smith',
        email: 'tim@example.com',
        language: 'fr',
        country: 'FR',
        affiliation: 'Open Lab',
        userData: {
          favouritePizza: 'Pepperoni',
        },
      })

      expect(result).toEqual(VOID_RESPONSE)
    })
    it('should do nothing if already registered', async () => {
      const { routes, registrationRepo, jwt, mailer } = setup()
      mocked(registrationRepo.getRegistrations).mockResolvedValue([
        mockRegistration({ email: 'tim@example.com' }),
      ])
      mocked(jwt.signToken).mockReturnValue('mock_verify_token')

      await routes.startRegister({
        name: 'Tim Smith',
        email: 'tim@example.com',
        language: 'fr',
        country: 'FR',
        affiliation: 'Open Lab',
        userData: {
          favouritePizza: 'Pepperoni',
        },
      })

      expect(mailer.sendVerifyEmail).not.toBeCalled()
    })
    it('should send an "alreadyVerified" email', async () => {
      const { routes, registrationRepo, jwt, mailer } = setup()
      mocked(registrationRepo.getRegistrations).mockResolvedValue([
        mockRegistration({ email: 'tim@example.com' }),
      ])
      mocked(jwt.signToken).mockReturnValue('mock_auth_token')

      await routes.startRegister({
        name: 'Tim Smith',
        email: 'tim@example.com',
        language: 'fr',
        country: 'FR',
        affiliation: 'Open Lab',
        userData: {
          favouritePizza: 'Pepperoni',
        },
      })

      expect(mailer.sendAlreadyRegisteredEmail).toBeCalledWith(
        expect.objectContaining({ email: 'tim@example.com' }),
        'mock_auth_token'
      )
    })
  })

  describe('#finishRegister', () => {
    it('should return a login link', async () => {
      const { routes, registrationRepo, jwt, url } = setup()
      mocked(jwt.verifyToken).mockReturnValue(mockVerifyToken())
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValueOnce(
        null
      )
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValueOnce(
        mockRegistration({ email: 'tim@example.com' })
      )
      mocked(jwt.signToken).mockReturnValue('mock_auth_token')
      mocked(url.getClientLoginLink).mockImplementation(
        (token) => new URL(`http://localhost#${token}`)
      )

      const result = await routes.finishRegister('mock_verify_token')

      expect(result).toEqual(new URL('http://localhost#mock_auth_token'))
    })
    it('should verify the user', async () => {
      const { routes, registrationRepo, jwt, url } = setup()
      mocked(jwt.verifyToken).mockReturnValue(mockVerifyToken())
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValueOnce(
        null
      )
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValueOnce(
        mockRegistration({ id: 1 })
      )
      mocked(jwt.signToken).mockReturnValue('mock_auth_token')

      await routes.finishRegister('mock_verify_token')

      expect(registrationRepo.verifyRegistration).toBeCalledWith(1)
    })
  })

  describe('#unregister', () => {
    it('should unregister the registration', async () => {
      const { routes, registrationRepo } = setup()
      const authToken = mockAuthToken()
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValue(
        mockRegistration({ email: 'tim@example.com' })
      )

      await routes.unregister(authToken)

      expect(registrationRepo.unregister).toBeCalledWith('tim@example.com')
    })
    it('should return a VOID_RESPONSE', async () => {
      const { routes, registrationRepo } = setup()
      const authToken = mockAuthToken()
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValue(
        mockRegistration({ email: 'tim@example.com' })
      )

      const result = await routes.unregister(authToken)

      expect(result).toEqual(VOID_RESPONSE)
    })
  })
})
