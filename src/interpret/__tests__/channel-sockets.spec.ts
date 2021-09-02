import { mocked } from 'ts-jest/utils'
import { mockAuthToken, mockSession } from '../../test-lib/fixtures'
import {
  mockConferenceRepository,
  mockJwtService,
  mockMetricsRepository,
  mockSocketService,
} from '../../test-lib/mocks'
import { ChannelSockets } from '../channel-sockets'

function setup() {
  const jwt = mockJwtService()
  const sockets = mockSocketService()
  const conferenceRepo = mockConferenceRepository()
  const metricsRepo = mockMetricsRepository()
  const channel = new ChannelSockets({
    sockets,
    jwt,
    conferenceRepo,
    metricsRepo,
  })
  return { channel, sockets, jwt, conferenceRepo, metricsRepo }
}

describe('ChannelSockets', () => {
  describe('#joinChannel', () => {
    it('should add the user to the room', async () => {
      const { channel, sockets, jwt, conferenceRepo } = setup()
      mocked(jwt.getSocketAuth).mockResolvedValue({
        authToken: mockAuthToken(),
        email: 'lisa@example.com',
        interpreter: null,
      })
      mocked(conferenceRepo.findSession).mockResolvedValue(
        mockSession({ enableInterpretation: true })
      )

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
      mocked(jwt.getSocketAuth).mockResolvedValue({
        authToken: mockAuthToken({ sub: 1 }),
        email: 'lisa@example.com',
        interpreter: null,
      })
      mocked(conferenceRepo.findSession).mockResolvedValue(
        mockSession({ enableInterpretation: true })
      )

      await channel.joinChannel('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'join-channel',
        { sessionId: 'session-a', channel: 'en' },
        { attendee: 1, socket: 'socket-a' }
      )
    })
  })

  describe('#leaveChannel', () => {
    it('should remove the user from the room', async () => {
      const { sockets, channel, jwt } = setup()
      mocked(sockets.getRoomsOfSocket).mockResolvedValue(
        new Set(['channel/session-a/en'])
      )
      mocked(jwt.getSocketAuth).mockResolvedValue({
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
      mocked(sockets.getRoomsOfSocket).mockResolvedValue(
        new Set(['channel/session-a/en'])
      )
      mocked(jwt.getSocketAuth).mockResolvedValue({
        authToken: mockAuthToken({ sub: 1 }),
        email: 'lisa@example.com',
        interpreter: null,
      })

      await channel.leaveChannel('socket-a', {
        sessionId: 'session-a',
        channel: 'en',
      })

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'leave-channel',
        { sessionId: 'session-a', channel: 'en' },
        { attendee: 1, socket: 'socket-a' }
      )
    })
  })
})
