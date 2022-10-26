import {
  mockAuthToken,
  mockInterpreter,
  mockSession,
  mockConferenceRepository,
  mockJwtService,
  mocked,
} from '../../test-lib/module.js'
import { InterpreterRepository } from '../interpreter-repository.js'

function setup() {
  const jwt = mockJwtService()
  const conferenceRepo = mockConferenceRepository()
  const repo = new InterpreterRepository({ jwt, conferenceRepo })
  return { repo, conferenceRepo, jwt }
}

describe('InterpreterRepository', () => {
  describe('#prepInterpreter', () => {
    it('should return the auth, session and interpret room', async () => {
      const { repo, conferenceRepo, jwt } = setup()
      mocked(jwt.getSocketAuth).mockResolvedValue({
        authToken: mockAuthToken({ sub: 1 }),
        email: 'jess@example.com',
        interpreter: mockInterpreter({ email: 'jess@example.com' }),
      })
      mocked(conferenceRepo.findSession).mockResolvedValue(
        mockSession({ id: 'session-a' })
      )

      const result = await repo.prepInterpreter('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(result).toEqual({
        auth: {
          authToken: expect.objectContaining({ sub: 1 }),
          email: 'jess@example.com',
          interpreter: expect.objectContaining({ email: 'jess@example.com' }),
        },
        session: expect.objectContaining({ id: 'session-a' }),
        interpretRoom: 'interpret/session-a/en',
        channelRoom: 'channel/session-a/en',
      })
    })
  })
})
