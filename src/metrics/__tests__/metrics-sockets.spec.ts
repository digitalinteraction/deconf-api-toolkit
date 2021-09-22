import { object, string } from 'superstruct'
import { mocked } from 'ts-jest/utils'
import { ApiError } from '../../module'
import {
  mockJwtService,
  mockMetricsRepository,
  mockSemaphore,
  mockSocketAuth,
  mockSocketService,
} from '../../test-lib/module'
import { MetricsSockets, SITE_VISITORS_ROOM } from '../metrics-sockets'

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
    eventStructs: new Map([['page-view', object({ path: string() })]]),
    pause: () => Promise.resolve(),
  })
  return { metrics, sockets, metricsRepo, semaphore, jwt }
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

      await metrics.cameOnline('socket-a')

      expect(sockets.sendError).not.toBeCalled()
      expect(sockets.emitTo).toBeCalledWith('socket-a', SITE_VISITORS_ROOM, 3)
    })
    // TODO: bad test because cameOnline no longer awaits #triggerVisitors
    // it('should release the lock', async () => {
    //   const { metrics, semaphore, sockets } = setup()
    //   mocked(sockets.getSocketsInRoom).mockResolvedValue([
    //     'socket-a',
    //     'socket-b',
    //     'socket-c',
    //   ])
    //   mocked(semaphore.aquire).mockResolvedValue(true)
    //   mocked(semaphore.hasLock).mockResolvedValue(true)

    //   await metrics.cameOnline('socket-a')

    //   expect(semaphore.release).toBeCalledWith('site_visitors')
    // })
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

      await metrics.wentOffline('socket-a')

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
      mocked(jwt.getSocketAuth).mockRejectedValue(new Error())

      await metrics.event('socket-a', 'page-view', { path: '/about' })

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'page-view',
        { path: '/about' },
        { socket: 'socket-a', attendee: undefined }
      )
    })
    it('should store an authenticated event', async () => {
      const { metrics, metricsRepo, jwt } = setup()
      mocked(jwt.getSocketAuth).mockResolvedValue(
        mockSocketAuth({ id: 1, email: 'geoff@example.com' })
      )

      await metrics.event('socket-a', 'page-view', { path: '/about' })

      expect(metricsRepo.trackEvent).toBeCalledWith(
        'page-view',
        { path: '/about' },
        { socket: 'socket-a', attendee: 1 }
      )
    })
    it('should send a client error for unknown events', async () => {
      const { metrics, metricsRepo, jwt, sockets } = setup()
      mocked(jwt.getSocketAuth).mockRejectedValue(new Error())

      await metrics.event('socket-a', 'page-reload', {})

      expect(metricsRepo.trackEvent).not.toBeCalled()
      expect(sockets.sendError).toBeCalledWith('socket-a', expect.any(ApiError))
    })
    it('should send a client error for bac payloads', async () => {
      const { metrics, metricsRepo, jwt, sockets } = setup()
      mocked(jwt.getSocketAuth).mockRejectedValue(new Error())

      await metrics.event('socket-a', 'page-view', {})

      expect(metricsRepo.trackEvent).not.toBeCalled()
      expect(sockets.sendError).toBeCalledWith('socket-a', expect.any(ApiError))
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
