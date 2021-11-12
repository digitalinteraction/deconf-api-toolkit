import { mocked } from 'ts-jest/utils'
import { mockInterpreter } from '../../module'
import { mockAuthToken, mockRegistration } from '../../test-lib/fixtures'
import {
  mockConferenceRepository,
  mockJwtService,
  mockKeyValueStore,
  mockRegistrationRepository,
  mockSocketService,
} from '../../test-lib/mocks'
import { AuthSockets } from '../auth-sockets'

function setup() {
  const store = mockKeyValueStore()
  const jwt = mockJwtService()
  const registrationRepo = mockRegistrationRepository()
  const conferenceRepo = mockConferenceRepository()
  const auth = new AuthSockets({ jwt, registrationRepo, conferenceRepo, store })
  return { auth, conferenceRepo, registrationRepo, jwt, store }
}

describe('AuthSockets', () => {
  describe('#auth', () => {
    it('should store the authentication token', async () => {
      const { auth, jwt, registrationRepo, store, conferenceRepo } = setup()
      const authToken = mockAuthToken({ sub: 1 })
      mocked(jwt.verifyToken).mockReturnValue(authToken)
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValue(
        mockRegistration({ email: 'geoff@example.com' })
      )
      mocked(conferenceRepo.findInterpreter).mockResolvedValue(null)

      await auth.auth('socket-a', 'fake_jwt')

      expect(store.put).toBeCalledWith('auth/socket-a', {
        authToken: authToken,
        email: 'geoff@example.com',
        interpreter: null,
      })
    })
    it('should store their interpretation record', async () => {
      const { auth, jwt, registrationRepo, store, conferenceRepo } = setup()
      const authToken = mockAuthToken({ sub: 1 })
      mocked(jwt.verifyToken).mockReturnValue(authToken)
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValue(
        mockRegistration({ email: 'jess@example.com' })
      )
      mocked(conferenceRepo.findInterpreter).mockResolvedValue(
        mockInterpreter({ email: 'jess@example.com' })
      )

      await auth.auth('socket-a', 'fake_jwt')

      expect(store.put).toBeCalledWith('auth/socket-a', {
        authToken: expect.objectContaining({ sub: 1 }),
        email: 'jess@example.com',
        interpreter: expect.objectContaining({ email: 'jess@example.com' }),
      })
    })
  })

  describe('#deauth', () => {
    it('should remove the authentication', async () => {
      const { auth, store } = setup()
      mocked(store.retrieve).mockResolvedValue({})

      await auth.deauth('socket-a')

      expect(store.delete).toBeCalledWith('auth/socket-a')
    })
  })
})
