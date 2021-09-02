import { mocked } from 'ts-jest/utils'
import {
  mockInterpreter,
  mockSession,
  mockSocketAuth,
} from '../../test-lib/fixtures'
import {
  mockInterpreterRepository,
  mockJwtService,
  mockKeyValueStore,
  mockMetricsRepository,
  mockS3Service,
  mockSocketService,
} from '../../test-lib/mocks'
import { InterpreterSockets } from '../interpreter-sockets'

function setup() {
  const jwt = mockJwtService()
  const store = mockKeyValueStore()
  const sockets = mockSocketService()
  const metricsRepo = mockMetricsRepository()
  const interpreterRepo = mockInterpreterRepository()
  const s3 = mockS3Service()
  const interpreter = new InterpreterSockets({
    jwt,
    store,
    sockets,
    interpreterRepo,
    metricsRepo,
    s3,
  })
  return { interpreter, jwt, sockets, metricsRepo, interpreterRepo, store, s3 }
}

function mockPrep(
  id: number,
  email: string,
  sessionId: string,
  channel: string
) {
  return {
    auth: mockSocketAuth({
      id: id,
      email: email,
      interpreter: true,
    }),
    interpretRoom: `interpret/${sessionId}/${channel}`,
    channelRoom: `channel/${sessionId}/${channel}`,
    session: mockSession(),
  }
}

describe('InterpreterSockets', () => {
  describe('#socketDisconnected', () => {
    it('should remove the active-interpreter if set', async () => {
      const { interpreter, store } = setup()
      store.data.set('active-interpreter/socket-a', {
        booth: { sessionId: 'session-a', channel: 'en' },
      })

      await interpreter.socketDisconnected('socket-a')

      expect(store.delete).toBeCalledWith('active-interpreter/socket-a')
    })
    it('should remove the active-booth packet if interpreting', async () => {
      const { interpreter, store } = setup()
      store.data.set('active-interpreter/socket-a', {
        booth: { sessionId: 'session-a', channel: 'en' },
      })
      store.data.set('active-booth/session-a/en', {
        socketId: 'socket-a',
        attendee: 1,
        interpreter: mockInterpreter({ email: 'jess@example.com' }),
      })

      await interpreter.socketDisconnected('socket-a')

      expect(store.delete).toBeCalledWith('active-booth/session-a/en')
    })
    it('should emit the leave to the booth', async () => {
      const { interpreter, sockets, store } = setup()
      store.data.set('active-interpreter/socket-a', {
        booth: { sessionId: 'session-a', channel: 'en' },
      })
      store.data.set('active-booth/session-a/en', {
        socketId: 'socket-a',
        attendee: 1,
        interpreter: mockInterpreter({ email: 'jess@example.com' }),
      })

      await interpreter.socketDisconnected('socket-a')

      expect(sockets.emitTo).toBeCalledWith(
        'interpret/session-a/en',
        'interpreter-left',
        expect.objectContaining({ email: 'jess@example.com' })
      )
    })
    it('should emit the stop to the booth', async () => {
      const { interpreter, sockets, store } = setup()
      store.data.set('active-interpreter/socket-a', {
        booth: { sessionId: 'session-a', channel: 'en' },
      })
      store.data.set('active-booth/session-a/en', {
        socketId: 'socket-a',
        attendee: 1,
        interpreter: mockInterpreter({ email: 'jess@example.com' }),
      })

      await interpreter.socketDisconnected('socket-a')

      expect(sockets.emitTo).toBeCalledWith(
        'interpret/session-a/en',
        'interpreter-stopped',
        expect.objectContaining({ email: 'jess@example.com' })
      )
    })
    it('should emit the stop to the channel', async () => {
      const { interpreter, sockets, store } = setup()
      store.data.set('active-interpreter/socket-a', {
        booth: { sessionId: 'session-a', channel: 'en' },
      })
      store.data.set('active-booth/session-a/en', {
        socketId: 'socket-a',
        attendee: 1,
        interpreter: mockInterpreter({ email: 'jess@example.com' }),
      })

      await interpreter.socketDisconnected('socket-a')

      expect(sockets.emitTo).toBeCalledWith(
        'channel/session-a/en',
        'channel-stopped'
      )
    })
  })

  describe('#acceptInterpret', () => {
    it('should emit the acceptance to the interpreter room', async () => {
      const { sockets, interpreter, interpreterRepo } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
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
    it('should log the event', async () => {
      const { interpreter, interpreterRepo, metricsRepo } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue({
        auth: mockSocketAuth({
          id: 1,
          email: 'jess@example.com',
          interpreter: true,
        }),
        interpretRoom: 'interpret/session-a/en',
        channelRoom: 'channel/session-a/en',
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
      mocked(sockets.getSocketsInRoom).mockResolvedValue(['socket-b'])
      mocked(jwt.getSocketAuth).mockResolvedValueOnce(
        mockSocketAuth({ id: 1, email: 'geoff@example.com', interpreter: true })
      )
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
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
      mocked(sockets.getSocketsInRoom).mockResolvedValue([])
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
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
      mocked(sockets.getSocketsInRoom).mockResolvedValue([])
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
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
      mocked(sockets.getSocketsInRoom).mockResolvedValue([])
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
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
      mocked(sockets.getSocketsInRoom).mockResolvedValue([])
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
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

  describe('#leaveBooth', () => {
    it('should leave the interpreter room', async () => {
      const { interpreter, sockets, interpreterRepo } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
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
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
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
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
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
    it('should remove any lingering active packets', async () => {
      const { interpreter, interpreterRepo, store } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )

      await interpreter.leaveBooth('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(store.delete).toBeCalledWith('active-interpreter/socket-a')
    })
    it('should log an event', async () => {
      const { interpreter, interpreterRepo, metricsRepo } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
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

  describe('#messageBooth', () => {
    it('should broadcast the message to the booth', async () => {
      const { interpreter, interpreterRepo, sockets } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
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

  describe('#requestInterpreter', () => {
    it('should broadcast the request to the booth', async () => {
      const { interpreter, interpreterRepo, sockets } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )

      const booth = { sessionId: 'session-a', channel: 'en' }
      await interpreter.requestInterpreter('socket-a', booth, 60)

      expect(sockets.emitTo).toBeCalledWith(
        'interpret/session-a/en',
        'interpreter-requested',
        expect.objectContaining({ email: 'jess@example.com' }),
        60
      )
    })
    it('should log an event', async () => {
      const { interpreter, interpreterRepo, metricsRepo } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )

      const booth = { sessionId: 'session-a', channel: 'en' }
      await interpreter.requestInterpreter('socket-a', booth, 60)

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'interpreter-requested',
        { sessionId: 'session-a', channel: 'en', duration: 60 },
        { attendee: 1, socket: 'socket-a' }
      )
    })
  })

  describe('#sendAudio', () => {
    it('should broadcast the data to the channel', async () => {
      const { interpreter, sockets, store } = setup()
      const booth = { sessionId: 'session-a', channel: 'en' }
      store.data.set('active-interpreter/socket-a', { booth })

      const buffer = Buffer.from('Some Audio', 'utf8')
      await interpreter.sendAudio('socket-a', buffer)

      expect(sockets.emitTo).toBeCalledWith(
        'channel/session-a/en',
        'channel-data',
        buffer
      )
    })
    it('should upload the chunk to s3', async () => {
      const { interpreter, s3, store } = setup()
      const booth = { sessionId: 'session-a', channel: 'en' }
      store.data.set('active-interpreter/socket-a', { booth })

      const buffer = Buffer.from('Some Audio', 'utf8')
      await interpreter.sendAudio('socket-a', buffer)

      expect(s3.uploadFile).toBeCalledWith(
        expect.stringMatching(/interpret\/session-a\/en\/\d+\.pcm/),
        buffer
      )
    })
  })

  describe('#startInterpret', () => {
    it('should boot any existing interpreters', async () => {
      const { interpreter, interpreterRepo, store, sockets } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )
      store.data.set('active-booth/session-a/en', {
        socketId: 'socket-b',
        attendee: 2,
        interpreter: mockInterpreter({ email: 'geoff@example.com' }),
      })

      await interpreter.startInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.emitTo).toBeCalledWith(
        'socket-b',
        'interpreter-takeover',
        expect.objectContaining({ email: 'jess@example.com' })
      )
    })
    it('should store the active-booth packet', async () => {
      const { interpreter, interpreterRepo, store } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )

      await interpreter.startInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(store.data.get('active-booth/session-a/en')).toEqual({
        socketId: 'socket-a',
        attendee: 1,
        interpreter: mockInterpreter({ email: 'jess@example.com' }),
      })
    })
    it('should store the active-interpreter packet', async () => {
      const { interpreter, interpreterRepo, store } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )

      await interpreter.startInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(store.data.get('active-interpreter/socket-a')).toEqual({
        booth: {
          sessionId: 'session-a',
          channel: 'en',
        },
      })
    })
    it('should broadcast the start to the booth', async () => {
      const { interpreter, interpreterRepo, sockets } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )

      await interpreter.startInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.emitTo).toBeCalledWith(
        'interpret/session-a/en',
        'interpreter-started',
        expect.objectContaining({ email: 'jess@example.com' })
      )
    })
    it('should broadcast the start to the channel', async () => {
      const { interpreter, interpreterRepo, sockets } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )

      await interpreter.startInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.emitTo).toBeCalledWith(
        'channel/session-a/en',
        'channel-started'
      )
    })
    it('should log an event', async () => {
      const { interpreter, interpreterRepo, metricsRepo } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )

      await interpreter.startInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'interpreter-started',
        { sessionId: 'session-a', channel: 'en' },
        { attendee: 1, socket: 'socket-a' }
      )
    })
  })

  describe('#stopInterpret', () => {
    it('should remove the active-interpreter packet', async () => {
      const { interpreter, interpreterRepo, store } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )

      await interpreter.stopInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(store.delete).toBeCalledWith('active-interpreter/socket-a')
    })
    it('should remove the active-booth packet', async () => {
      const { interpreter, interpreterRepo, store } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )

      await interpreter.stopInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(store.delete).toBeCalledWith('active-booth/session-a/en')
    })
    it('should broadcast the stop to the booth', async () => {
      const { interpreter, interpreterRepo, sockets } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )

      await interpreter.stopInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.emitTo).toBeCalledWith(
        'interpret/session-a/en',
        'interpreter-stopped',
        expect.objectContaining({ email: 'jess@example.com' })
      )
    })
    it('should broadcast the stop to the channel', async () => {
      const { interpreter, interpreterRepo, sockets } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )

      await interpreter.stopInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.emitTo).toBeCalledWith(
        'channel/session-a/en',
        'channel-stopped'
      )
    })
    it('should log an event', async () => {
      const { interpreter, interpreterRepo, metricsRepo } = setup()
      mocked(interpreterRepo.prepInterpreter).mockResolvedValue(
        mockPrep(1, 'jess@example.com', 'session-a', 'en')
      )

      await interpreter.stopInterpret('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'interpreter-stopped',
        { sessionId: 'session-a', channel: 'en' },
        { attendee: 1, socket: 'socket-a' }
      )
    })
  })
})
