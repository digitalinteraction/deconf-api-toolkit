import { mocked } from 'ts-jest/utils'
import {
  mockInterpreter,
  mockKeyValueStore,
  mockSession,
  mockSessionType,
  mockSettings,
  mockSpeaker,
  mockTheme,
  mockTrack,
} from '../../test-lib/module'
import { ConferenceRepository } from '../conference-repository'

function setup() {
  const store = mockKeyValueStore()
  const repo = new ConferenceRepository({ store })
  return { store, repo }
}

describe('ConferenceRepository', () => {
  describe('#getSlots', () => {
    it('should return the slots with parsed dates', async () => {
      const { store, repo } = setup()
      store.data.set('schedule.slots', [
        {
          id: 1,
          start: '2021-01-01T00:00:00.000Z',
          end: '2021-08-12T23:59:59.999Z',
        },
      ])

      const result = await repo.getSlots()

      expect(result).toEqual([
        {
          id: 1,
          start: new Date('2021-01-01T00:00:00.000Z'),
          end: new Date('2021-08-12T23:59:59.999Z'),
        },
      ])
    })
  })

  describe('#getSessions', () => {
    it('should return sessions', async () => {
      const { store, repo } = setup()
      store.data.set('schedule.sessions', [mockSession({ id: 'session-a' })])

      const result = await repo.getSessions()

      expect(result).toEqual([expect.objectContaining({ id: 'session-a' })])
    })
  })

  describe('#findSession', () => {
    it('should return the matching', async () => {
      const { store, repo } = setup()
      store.data.set('schedule.sessions', [mockSession({ id: 'session-a' })])

      const result = await repo.findSession('session-a')

      expect(result).toEqual(expect.objectContaining({ id: 'session-a' }))
    })
  })

  describe('#getTracks', () => {
    it('should return tracks', async () => {
      const { store, repo } = setup()
      store.data.set('schedule.tracks', [mockTrack({ id: 'track-a' })])

      const result = await repo.getTracks()

      expect(result).toEqual([expect.objectContaining({ id: 'track-a' })])
    })
  })

  describe('#getThemes', () => {
    it('should return themes', async () => {
      const { store, repo } = setup()
      store.data.set('schedule.themes', [mockTheme({ id: 'theme-a' })])

      const result = await repo.getThemes()

      expect(result).toEqual([expect.objectContaining({ id: 'theme-a' })])
    })
  })

  describe('#getSpeakers', () => {
    it('should return speakers', async () => {
      const { store, repo } = setup()
      store.data.set('schedule.speakers', [mockSpeaker({ id: 'speaker-a' })])

      const result = await repo.getSpeakers()

      expect(result).toEqual([expect.objectContaining({ id: 'speaker-a' })])
    })
  })

  describe('#getTypes', () => {
    it('should return types', async () => {
      const { store, repo } = setup()
      store.data.set('schedule.types', [mockSessionType({ id: 'type-a' })])

      const result = await repo.getTypes()

      expect(result).toEqual([expect.objectContaining({ id: 'type-a' })])
    })
  })

  describe('#getSettings', () => {
    it('should return types', async () => {
      const { store, repo } = setup()
      const settings = mockSettings()
      store.data.set('schedule.settings', settings)

      const result = await repo.getSettings()

      expect(result).toEqual(settings)
    })
  })

  describe('#getInterpreters', () => {
    it('should return interpreters', async () => {
      const { store, repo } = setup()
      store.data.set('schedule.interpreters', [
        mockInterpreter({ id: 'interpreter-a' }),
      ])

      const result = await repo.getInterpreters()

      expect(result).toEqual([expect.objectContaining({ id: 'interpreter-a' })])
    })
  })

  describe('#findInterpreter', () => {
    it('should return interpreter', async () => {
      const { store, repo } = setup()
      store.data.set('schedule.interpreters', [
        mockInterpreter({ email: 'jess@example.com' }),
      ])

      const result = await repo.findInterpreter('jess@example.com')

      expect(result).toEqual(
        expect.objectContaining({ email: 'jess@example.com' })
      )
    })
  })
})
