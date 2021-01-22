import { mocked } from 'ts-jest/utils'
import { mockQueryService, mockRedisService } from '../../services/__mocks__'
import { CountryLocation, createCarbonModule } from '../carbon-module'

function setup() {
  const redis = mockRedisService()
  const query = mockQueryService()
  const locations: CountryLocation[] = [
    {
      code: 'GB',
      name: 'United Kingdom',
      location: { lat: 55.378051, lng: -3.435973 },
    },
    {
      code: 'FR',
      name: 'France',
      location: { lat: 46.227638, lng: 2.213749 },
    },
  ]
  const countryOfOrigin = 'GB'

  const carbon = createCarbonModule({
    redis,
    query,
    locations,
    countryOfOrigin,
  })
  return { redis, query, locations, countryOfOrigin, carbon }
}

describe('getCarbon', () => {
  it('should return the cached value if there is one', async () => {
    const { carbon, redis } = setup()
    mocked(redis.getJson).mockResolvedValue({
      totalDistance: 1234,
      carbonNotEmitted: 5678,
    })

    const result = await carbon.getCarbon()

    expect(result.status).toEqual(200)
    expect(result.body).toEqual({
      totalDistance: 1234,
      carbonNotEmitted: 5678,
    })
  })
  it('should calculate the carbon footprint', async () => {
    const { carbon, query } = setup()
    mocked(query.getCountryCount).mockResolvedValue([
      { country: 'FR', count: 1 },
    ])

    const result = await carbon.getCarbon()

    expect(result.status).toEqual(200)

    // 1091km between UK and france (twice)
    // http://www.movable-type.co.uk/scripts/latlong.html
    expect(result.body.totalDistance).toBeCloseTo(2185077, 0)

    // 2,182km * 0.195 ~= 426
    expect(result.body.carbonNotEmitted).toBeCloseTo(426, 0)
  })
  it('should cache the calculated values for 5m', async () => {
    const { carbon, query, redis } = setup()
    mocked(query.getCountryCount).mockResolvedValue([
      { country: 'FR', count: 1 },
    ])

    await carbon.getCarbon()

    expect(redis.setJson).toBeCalledWith('c02', {
      totalDistance: expect.any(Number),
      carbonNotEmitted: expect.any(Number),
    })
    expect(redis.setExpiry).toBeCalledWith('c02', 5 * 60)
  })
})
