import { mocked } from 'ts-jest/utils'
import {
  mockAuthToken,
  mockInterpreter,
  mockSession,
  mockSocketAuth,
} from '../../test-lib/fixtures'
import {
  mockConferenceRepository,
  mockInterpreterRepository,
  mockJwtService,
  mockMetricsRepository,
  mockSocketService,
} from '../../test-lib/mocks'
import { InterpreterSockets } from '../interpreter-sockets'

function setup() {
  const jwt = mockJwtService()
  const sockets = mockSocketService()
  const metricsRepo = mockMetricsRepository()
  const interpreterRepo = mockInterpreterRepository()
  const interpreter = new InterpreterSockets({
    jwt,
    sockets,
    interpreterRepo,
    metricsRepo,
  })
  return { interpreter, jwt, sockets, metricsRepo, interpreterRepo }
}

describe('InterpreterSockets', () => {
  describe('#socketDisconnected', () => {
    it('should emit interpret-left to the interpreter room', async () => {
      const { interpreter, sockets, jwt } = setup()
      mocked(sockets.getSocketRooms).mockResolvedValue(
        new Set(['interpret/session-a/en'])
      )
      mocked(jwt.getSocketAuth).mockResolvedValue({
        authToken: mockAuthToken(),
        email: 'jess@example.com',
        interpreter: mockInterpreter({ email: 'jess@example.com' }),
      })

      await interpreter.socketDisconnected('socket-a')

      expect(sockets.emitTo).toBeCalledWith(
        'interpret/session-a/en',
        'interpret-left',
        expect.objectContaining({ email: 'jess@example.com' })
      )
    })
  })

  describe('#acceptInterpret', () => {
    it('should emit an acceptance to the room', async () => {
      const { sockets, interpreter, interpreterRepo } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue({
        auth: mockSocketAuth({
          id: 1,
          email: 'jess@example.com',
          interpreter: true,
        }),
        interpretRoom: 'interpret/session-a/en',
        session: mockSession(),
      })

      await interpreter.acceptInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.emitTo).toBeCalledWith(
        'interpret/session-a/en',
        'interpret-accepted',
        expect.objectContaining({ email: 'jess@example.com' })
      )
    })
    it('should track the event', async () => {
      const { sockets, interpreter, interpreterRepo, metricsRepo } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue({
        auth: mockSocketAuth({
          id: 1,
          email: 'jess@example.com',
          interpreter: true,
        }),
        interpretRoom: 'interpret/session-a/en',
        session: mockSession(),
      })

      await interpreter.acceptInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'interpret-accepted',
        { sessionId: 'session-a', channel: 'en' },
        { attendee: 1, socket: 'socket-a' }
      )
    })
  })
})
