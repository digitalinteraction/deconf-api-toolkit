import os from 'os'
import { mockKeyValueStore } from '../../test-lib/mocks'
import { SemaphoreService } from '../semaphore-service'

function setup() {
  const store = mockKeyValueStore()
  const service = new SemaphoreService({ store })
  return { service, store }
}

describe('SemaphoreService', () => {
  describe('#aquire', () => {
    it('should return false if locked', async () => {
      const { service, store } = setup()
      store.data.set('lock_key', {
        time: Date.now(),
        hostname: 'hostname-a',
      })

      const result = await service.aquire('lock_key', 1000)

      expect(result).toEqual(false)
    })
    it('should return true if the lock is aquired', async () => {
      const { service, store } = setup()

      const result = await service.aquire('lock_key', 1000)

      expect(result).toEqual(true)
    })
    it('should store a new lock record', async () => {
      const { service, store } = setup()

      await service.aquire('lock_key', 1000)

      expect(store.data.get('lock_key')).toEqual({
        time: expect.any(Number),
        hostname: expect.any(String),
      })
    })
    it('should return true if the lock has expired', async () => {
      const { service, store } = setup()
      store.data.set('lock_key', {
        time: Date.now() - 5000,
        hostname: 'hostname-a',
      })

      const result = await service.aquire('lock_key', 1000)

      expect(result).toEqual(true)
    })
  })

  describe('#release', () => {
    it('should return true if not locked', async () => {
      const { service, store } = setup()

      const result = await service.release('lock_key')

      expect(result).toEqual(true)
    })
    it('should return false if not the same host', async () => {
      const { service, store } = setup()
      store.data.set('lock_key', {
        time: Date.now(),
        hostname: 'hostname-a',
      })

      const result = await service.release('lock_key')

      expect(result).toEqual(false)
    })
    it('should return true if the same host', async () => {
      const { service, store } = setup()
      store.data.set('lock_key', {
        time: Date.now(),
        hostname: os.hostname(),
      })

      const result = await service.release('lock_key')

      expect(result).toEqual(true)
    })
    it('should remove the lock if the same host', async () => {
      const { service, store } = setup()
      store.data.set('lock_key', {
        time: Date.now(),
        hostname: os.hostname(),
      })

      await service.release('lock_key')

      expect(store.data.get('lock_key')).toEqual(undefined)
    })
  })
})
