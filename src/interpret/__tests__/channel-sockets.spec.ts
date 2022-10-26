import {
  mockAuthToken,
  mockSession,
  mockConferenceRepository,
  mockJwtService,
  mockKeyValueStore,
  mockMetricsRepository,
  mockSocketService,
} from '../../test-lib/module.js'
import { ChannelSockets } from '../channel-sockets.js'

function setup() {
  const jwt = mockJwtService()
  const sockets = mockSocketService()
  const conferenceRepo = mockConferenceRepository()
  const metricsRepo = mockMetricsRepository()
  const store = mockKeyValueStore()
  const channel = new ChannelSockets({
    sockets,
    jwt,
    conferenceRepo,
    metricsRepo,
    store,
  })
  return { channel, sockets, jwt, conferenceRepo, metricsRepo, store }
}

describe('ChannelSockets', () => {
  describe('#joinChannel', () => {
    it('should add the user to the room', async () => {
      const { channel, sockets, jwt, conferenceRepo } = setup()
      jest.mocked(jwt.getSocketAuth).mockResolvedValue({
        authToken: mockAuthToken(),
        email: 'lisa@example.com',
        interpreter: null,
      })
      jest
        .mocked(conferenceRepo.findSession)
        .mockResolvedValue(mockSession({ enableInterpretation: true }))

      await channel.joinChannel('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.joinRoom).toBeCalledWith(
        'socket-a',
        'channel/session-a/en'
      )
    })
    it('should log a metrics event', async () => {
      const { channel, metricsRepo, jwt, conferenceRepo } = setup()
      jest.mocked(jwt.getSocketAuth).mockResolvedValue({
        authToken: mockAuthToken({ sub: 1 }),
        email: 'lisa@example.com',
        interpreter: null,
      })
      jest
        .mocked(conferenceRepo.findSession)
        .mockResolvedValue(mockSession({ enableInterpretation: true }))

      await channel.joinChannel('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'session/joinChannel',
        { sessionId: 'session-a', channel: 'en' },
        { attendee: 1, socket: 'socket-a' }
      )
    })
    it('should emit channel-started if it has already started', async () => {
      const { channel, sockets, jwt, conferenceRepo, store } = setup()
      jest.mocked(jwt.getSocketAuth).mockResolvedValue({
        authToken: mockAuthToken(),
        email: 'lisa@example.com',
        interpreter: null,
      })
      jest
        .mocked(conferenceRepo.findSession)
        .mockResolvedValue(mockSession({ enableInterpretation: true }))
      store.data.set('active-booth/session-a/en', { _: 'something non-null' })

      await channel.joinChannel('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.emitTo).toBeCalledWith('socket-a', 'channel-started')
    })
  })

  describe('#leaveChannel', () => {
    it('should remove the user from the room', async () => {
      const { sockets, channel, jwt } = setup()
      jest
        .mocked(sockets.getRoomsOfSocket)
        .mockResolvedValue(new Set(['channel/session-a/en']))
      jest.mocked(jwt.getSocketAuth).mockResolvedValue({
        authToken: mockAuthToken({ sub: 1 }),
        email: 'lisa@example.com',
        interpreter: null,
      })

      await channel.leaveChannel('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(sockets.leaveRoom).toBeCalledWith(
        'socket-a',
        'channel/session-a/en'
      )
    })
    it('should log a leave-channel event', async () => {
      const { sockets, channel, metricsRepo, jwt } = setup()
      jest
        .mocked(sockets.getRoomsOfSocket)
        .mockResolvedValue(new Set(['channel/session-a/en']))
      jest.mocked(jwt.getSocketAuth).mockResolvedValue({
        authToken: mockAuthToken({ sub: 1 }),
        email: 'lisa@example.com',
        interpreter: null,
      })

      await channel.leaveChannel('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'session/leaveChannel',
        { sessionId: 'session-a', channel: 'en' },
        { attendee: 1, socket: 'socket-a' }
      )
    })
  })
})
