import {
  mockJwtService,
  mockRegistration,
  mockRegistrationRepository,
  mockUrlService,
  jest,
} from '../../test-lib/module.js'
import { DevAuthCommand } from '../dev-auth-command.js'

function setup() {
  const jwt = mockJwtService()
  const url = mockUrlService()
  const registrationRepo = mockRegistrationRepository()
  const devAuthCmd = new DevAuthCommand({
    jwt,
    url,
    registrationRepo,
  })
  return { jwt, url, registrationRepo, devAuthCmd }
}

describe('DevAuthCommand', () => {
  describe('#process', () => {
    it('should return a signed token and login URL', async () => {
      const { devAuthCmd, registrationRepo, jwt, url } = setup()
      jest
        .mocked(registrationRepo.getRegistrations)
        .mockResolvedValue([mockRegistration({ email: 'geoff@example.com' })])
      jest
        .mocked(url.getClientLoginLink)
        .mockReturnValue(new URL('http://mock_url'))
      jest.mocked(jwt.signToken).mockReturnValue('mock_token')

      const result = await devAuthCmd.process({
        email: 'geoff@example.com',
        interpreter: true,
        admin: true,
      })

      expect(result).toEqual({
        token: 'mock_token',
        url: expect.any(URL),
      })
    })
  })
})
