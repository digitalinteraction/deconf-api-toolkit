import { mocked } from 'ts-jest/utils'
import {
  mockJwtService,
  mockMetricsRepository,
  mockSemaphore,
  mockSocketAuth,
  mockSocketService,
} from '../../test-lib/module'
import { MetricsSockets, SITE_VISITORS_ROOM } from '../metrics-sockets'

jest.useFakeTimers()

function setup() {
  const sockets = mockSocketService()
  const metricsRepo = mockMetricsRepository()
  const semaphore = mockSemaphore()
  const jwt = mockJwtService()
  const metrics = new MetricsSockets({
    sockets,
    metricsRepo,
    semaphore,
    jwt,
  })
  return { metrics, sockets, metricsRepo, semaphore, jwt }
}

/**
 * Let a promise be created with some "await"s before a setTimeout method started
 * and allow the whole thing to be awaited.
 * */
function waitForAsyncTimers<T>(promise: Promise<T>) {
  process.nextTick(() => {
    jest.runAllTimers()
  })
  return promise
}

describe('MetricsSockets', () => {
  describe('#cameOnline', () => {
    it('should add the socket to the room', async () => {
      const { metrics, sockets } = setup()
      mocked(sockets.getSocketsInRoom).mockResolvedValue([])

      await metrics.cameOnline('socket-a')

      expect(sockets.joinRoom).toBeCalledWith('socket-a', SITE_VISITORS_ROOM)
    })
    it('should emit the current visitors to the socket', async () => {
      const { metrics, sockets } = setup()
      mocked(sockets.getSocketsInRoom).mockResolvedValue([
        'socket-a',
        'socket-b',
        'socket-c',
      ])

      await metrics.cameOnline('socket-a')

      expect(sockets.emitTo).toBeCalledWith('socket-a', 'site-visitors', 3)
    })
    it('should broadcast the site visitors to everyone', async () => {
      const { metrics, semaphore, sockets } = setup()
      mocked(sockets.getSocketsInRoom).mockResolvedValue([
        'socket-a',
        'socket-b',
        'socket-c',
      ])
      mocked(semaphore.aquire).mockResolvedValue(true)
      mocked(semaphore.hasLock).mockResolvedValue(true)

      await waitForAsyncTimers(metrics.cameOnline('socket-a'))

      expect(sockets.emitTo).toBeCalledWith(
        SITE_VISITORS_ROOM,
        'site-visitors',
        3
      )
    })
  })

  describe('#wentOffilne', () => {
    it('should broadcast the site visitors to everyone', async () => {
      const { metrics, semaphore, sockets } = setup()
      mocked(sockets.getSocketsInRoom).mockResolvedValue([
        'socket-a',
        'socket-b',
        'socket-c',
      ])
      mocked(semaphore.aquire).mockResolvedValue(true)
      mocked(semaphore.hasLock).mockResolvedValue(true)

      await waitForAsyncTimers(metrics.wentOffline('socket-a'))

      expect(sockets.emitTo).toBeCalledWith(
        SITE_VISITORS_ROOM,
        'site-visitors',
        3
      )
    })
  })

  describe('#event', () => {
    it('should store an event', async () => {
      const { metrics, metricsRepo, jwt } = setup()
      mocked(jwt.getSocketAuth).mockResolvedValue(
        mockSocketAuth({ id: 1, email: 'geoff@example.com' })
      )

      await metrics.event('socket-a', 'test-event', { name: 'Geoff' })

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'test-event',
        { name: 'Geoff' },
        { socket: 'socket-a', attendee: 1 }
      )
    })
  })

  describe('#event', () => {
    it('should store an event', async () => {
      const { metrics, metricsRepo, jwt } = setup()
      mocked(jwt.getSocketAuth).mockResolvedValue(
        mockSocketAuth({ id: 1, email: 'geoff@example.com' })
      )

      await metrics.error('socket-a', new Error('Test Error'))

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'client-error',
        { message: 'Test Error', stack: expect.any(String) },
        { socket: 'socket-a', attendee: 1 }
      )
    })
  })
})
