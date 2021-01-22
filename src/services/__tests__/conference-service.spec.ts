import { createConferenceService } from '../conference-service'

function setup() {
  const cache = new Map<string, any>()
  const service = createConferenceService(
    (key, fallback) => cache.get(key) ?? fallback ?? null
  )
  return { cache, service }
}

describe('getSlots', () => {
  it('should return slots and parse dates', async () => {
    const { cache, service } = setup()
    cache.set('schedule.slots', [
      {
        id: '1',
        start: '2021-01-19T15:25:42.248Z',
        end: '2021-01-19T15:25:42.248Z',
      },
    ])

    const result = await service.getSlots()

    expect(result).toEqual([
      {
        id: '1',
        start: expect.any(Date),
        end: expect.any(Date),
      },
    ])
  })
})

describe('getSessions', () => {
  it('should return whats in from the cache', async () => {
    const { cache, service } = setup()
    cache.set('schedule.sessions', ['a', 'b', 'c'])

    const result = await service.getSessions()

    expect(result).toEqual(['a', 'b', 'c'])
  })
})

describe('getTracks', () => {
  it('should return whats in from the cache', async () => {
    const { cache, service } = setup()
    cache.set('schedule.tracks', ['a', 'b', 'c'])

    const result = await service.getTracks()

    expect(result).toEqual(['a', 'b', 'c'])
  })
})

describe('getThemes', () => {
  it('should return whats in from the cache', async () => {
    const { cache, service } = setup()
    cache.set('schedule.themes', ['a', 'b', 'c'])

    const result = await service.getThemes()

    expect(result).toEqual(['a', 'b', 'c'])
  })
})

describe('getSpeakers', () => {
  it('should return whats in from the cache', async () => {
    const { cache, service } = setup()
    cache.set('schedule.speakers', ['a', 'b', 'c'])

    const result = await service.getSpeakers()

    expect(result).toEqual(['a', 'b', 'c'])
  })
})

describe('getTypes', () => {
  it('should return whats in from the cache', async () => {
    const { cache, service } = setup()
    cache.set('schedule.types', ['a', 'b', 'c'])

    const result = await service.getTypes()

    expect(result).toEqual(['a', 'b', 'c'])
  })
})

describe('getInterpreters', () => {
  it('should return whats in from the cache', async () => {
    const { cache, service } = setup()
    cache.set('schedule.interpreters', ['a', 'b', 'c'])

    const result = await service.getInterpreters()

    expect(result).toEqual(['a', 'b', 'c'])
  })
})

describe('getSettings', () => {
  it('should return whats in from the cache', async () => {
    const { cache, service } = setup()
    cache.set('schedule.settings', { some: 'thing' })

    const result = await service.getSettings()

    expect(result).toEqual({ some: 'thing' })
  })
})

describe('findSession', () => {
  it('should find a session with that id', async () => {
    const { cache, service } = setup()
    cache.set('schedule.sessions', [
      { id: '1', name: 'alpha' },
      { id: '2', name: 'beta' },
      { id: '3', name: 'gamma' },
    ])

    const result = await service.findSession('2')

    expect(result).toEqual({
      id: '2',
      name: 'beta',
    })
  })
})

describe('findInterpreter', () => {
  it('should find a translator with that email', async () => {
    const { cache, service } = setup()
    cache.set('schedule.interpreters', [
      { email: 'geoff@example.com', name: 'Geoff' },
      { email: 'jen@evil.corp', name: 'Jenny Phillips' },
    ])

    const result = await service.findInterpreter('jen@evil.corp')

    expect(result).toEqual({
      email: 'jen@evil.corp',
      name: 'Jenny Phillips',
    })
  })
})
