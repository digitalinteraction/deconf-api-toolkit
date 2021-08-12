import { mocked } from 'ts-jest/utils'
import { createTestingDeconfConfig } from '../../lib/config'
import {
  createTestingResources,
  mockCarbonRepository,
  mockKeyValueStore,
} from '../../test-lib/module'
import { CarbonRoutes, CARBON_CACHE_KEY } from '../carbon-routes'

function setup() {
  const config = createTestingDeconfConfig()
  const resources = createTestingResources()
  const carbonRepo = mockCarbonRepository()
  const store = mockKeyValueStore()
  const routes = new CarbonRoutes({ carbonRepo, config, resources, store })
  return { carbonRepo, config, resources, store, routes }
}

describe('CarbonRoutes', () => {
  describe('getCarbon', () => {
    it('should return the carbon estimate and distance', async () => {
      const { routes, carbonRepo } = setup()
      mocked(carbonRepo.getCountryCount).mockResolvedValue([
        { country: 'FR', count: 1 },
      ])

      const result = await routes.getCarbon()

      // 1091km between UK and france (twice)
      // http://www.movable-type.co.uk/scripts/latlong.html
      expect(result.totalDistance).toBeCloseTo(2185077, 0)

      // 2,182km * 0.195 ~= 426
      expect(result.carbonNotEmitted).toBeCloseTo(426, 0)
    })
    it('should store the cached version for a limited time', async () => {
      const { routes, carbonRepo, store } = setup()
      mocked(carbonRepo.getCountryCount).mockResolvedValue([
        { country: 'FR', count: 1 },
      ])

      await routes.getCarbon()

      expect(store.put).toBeCalledWith(CARBON_CACHE_KEY, {
        totalDistance: expect.any(Number),
        carbonNotEmitted: expect.any(Number),
      })
      expect(store.setExpiry).toBeCalledWith(CARBON_CACHE_KEY, 300)
    })
    it('should return the cached version if there is one', async () => {
      const { routes, carbonRepo, store } = setup()
      mocked(carbonRepo.getCountryCount).mockResolvedValue([
        { country: 'FR', count: 1 },
      ])
      store.data.set(CARBON_CACHE_KEY, {
        totalDistance: 100,
        carbonNotEmitted: 1,
      })

      const result = await routes.getCarbon()

      expect(result).toEqual({
        totalDistance: 100,
        carbonNotEmitted: 1,
      })
    })
  })
})
