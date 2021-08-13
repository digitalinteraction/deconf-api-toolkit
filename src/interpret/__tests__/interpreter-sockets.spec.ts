import { mocked } from 'ts-jest/utils'
import {
  mockAuthToken,
  mockInterpreter,
  mockRegistration,
  mockSession,
  mockSocketAuth,
} from '../../test-lib/fixtures'
import {
  mockInterpreterRepository,
  mockJwtService,
  mockKeyValueStore,
  mockMetricsRepository,
  mockSocketService,
} from '../../test-lib/mocks'
import { InterpreterSockets } from '../interpreter-sockets'

function setup() {
  const jwt = mockJwtService()
  const store = mockKeyValueStore()
  const sockets = mockSocketService()
  const metricsRepo = mockMetricsRepository()
  const interpreterRepo = mockInterpreterRepository()
  const interpreter = new InterpreterSockets({
    jwt,
    store,
    sockets,
    interpreterRepo,
    metricsRepo,
  })
  return { interpreter, jwt, sockets, metricsRepo, interpreterRepo, store }
}

function mockPrep(id: number, email: string) {
  return {
    auth: mockSocketAuth({
      id: id,
      email: email,
      interpreter: true,
    }),
    interpretRoom: 'interpret/session-a/en',
    session: mockSession(),
  }
}

describe('InterpreterSockets', () => {
  describe('#socketDisconnected', () => {
    it('should emit interpreter-left to the interpreter room', async () => {
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
        'interpreter-left',
        expect.objectContaining({ email: 'jess@example.com' })
      )
    })
  })

  describe('#acceptInterpret', () => {
    it('should emit an acceptance to the room', async () => {
      const { sockets, interpreter, interpreterRepo } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com')
      )

      await interpreter.acceptInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.emitTo).toBeCalledWith(
        'interpret/session-a/en',
        'interpreter-accepted',
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
        'interpreter-accepted',
        { sessionId: 'session-a', channel: 'en' },
        { attendee: 1, socket: 'socket-a' }
      )
    })
  })

  describe('#joinBooth', () => {
    it('should emit the rooms occupants to the joiner', async () => {
      const { interpreter, sockets, jwt, interpreterRepo } = setup()
      mocked(sockets.getRoomSockets).mockResolvedValue(['socket-b'])
      mocked(jwt.getSocketAuth).mockResolvedValueOnce(
        mockSocketAuth({ id: 1, email: 'geoff@example.com', interpreter: true })
      )
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com')
      )

      await interpreter.joinBooth('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.emitTo).toBeCalledWith(
        'socket-a',
        'interpreter-joined',
        expect.objectContaining({ email: 'geoff@example.com' })
      )
    })
    it('should emit the active interpreter to the joiner', async () => {
      const { interpreter, sockets, interpreterRepo, store } = setup()
      mocked(sockets.getRoomSockets).mockResolvedValue([])
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com')
      )
      store.data.set('active-booth/session-a/en', {
        socketId: 'socket-b',
        attendee: 2,
        interpreter: mockInterpreter({ email: 'geoff@example.com' }),
      })

      await interpreter.joinBooth('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.emitTo).toBeCalledWith(
        'socket-a',
        'interpreter-started',
        expect.objectContaining({ email: 'geoff@example.com' })
      )
    })
    it('should join the interpret room', async () => {
      const { interpreter, sockets, interpreterRepo, store } = setup()
      mocked(sockets.getRoomSockets).mockResolvedValue([])
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com')
      )

      await interpreter.joinBooth('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.joinRoom).toBeCalledWith(
        'socket-a',
        'interpret/session-a/en'
      )
    })
    it('should emit the joining to the room', async () => {
      const { interpreter, sockets, interpreterRepo } = setup()
      mocked(sockets.getRoomSockets).mockResolvedValue([])
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com')
      )

      await interpreter.joinBooth('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.emitTo).toBeCalledWith(
        'interpret/session-a/en',
        'interpreter-joined',
        expect.objectContaining({
          email: 'jess@example.com',
        })
      )
    })
    it('should log an event', async () => {
      const { interpreter, sockets, interpreterRepo, metricsRepo } = setup()
      mocked(sockets.getRoomSockets).mockResolvedValue([])
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com')
      )

      await interpreter.joinBooth('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'interpreter-joined',
        { sessionId: 'session-a', channel: 'en' },
        { attendee: 1, socket: 'socket-a' }
      )
    })
  })

  describe('leaveBooth', () => {
    it('should leave the interpreter room', async () => {
      const { interpreter, sockets, interpreterRepo } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com')
      )

      await interpreter.leaveBooth('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.leaveRoom).toBeCalledWith(
        'socket-a',
        'interpret/session-a/en'
      )
    })
    it('should broadcast the leaving to the booth', async () => {
      const { interpreter, sockets, interpreterRepo } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com')
      )

      await interpreter.leaveBooth('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.emitTo).toBeCalledWith(
        'interpret/session-a/en',
        'interpreter-left',
        expect.objectContaining({ email: 'jess@example.com' })
      )
    })
    it('should stop interpretation if active', async () => {
      const { interpreter, sockets, interpreterRepo, store } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com')
      )
      store.data.set('active-booth/session-a/en', {
        socketId: 'socket-a',
        attendee: 1,
        interpreter: mockInterpreter({ email: 'jess@example.com' }),
      })

      await interpreter.leaveBooth('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.emitTo).toBeCalledWith(
        'interpret/session-a/en',
        'interpreter-stopped',
        expect.objectContaining({ email: 'jess@example.com' })
      )
      expect(sockets.emitTo).toBeCalledWith(
        'channel/session-a/en',
        'channel-stopped'
      )
    })
    it('should log an event', async () => {
      const { interpreter, interpreterRepo, metricsRepo } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com')
      )

      await interpreter.leaveBooth('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'interpreter-left',
        { sessionId: 'session-a', channel: 'en' },
        { attendee: 1, socket: 'socket-a' }
      )
    })
  })

  describe('messageBooth', () => {
    it('should broadcast the message to the booth', async () => {
      const { interpreter, interpreterRepo, sockets } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com')
      )

      const booth = { sessionId: 'session-a', channel: 'en' }
      await interpreter.messageBooth('socket-a', booth, 'Test Message')

      expect(sockets.emitTo).toBeCalledWith(
        'interpret/session-a/en',
        'interpreter-message',
        expect.objectContaining({ email: 'jess@example.com' }),
        'Test Message'
      )
    })
  })
})
