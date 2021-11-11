import { mockKeyValueStore } from '../../test-lib/module'
import { makeFixture, MockScheduleCommand } from '../mock-schedule-command'

function setup() {
  const store = mockKeyValueStore()
  const mockSchedule = new MockScheduleCommand({ store })
  return { store, mockSchedule }
}

describe('MockScheduleCommand', () => {
  describe('#process', () => {
    it('should store conference resources', async () => {
      const { mockSchedule, store } = setup()

      await mockSchedule.process({
        interpreterEmails: ['jess@example.com'],
      })

      expect(store.put).toBeCalledWith('schedule.slots', expect.any(Array))
      expect(store.put).toBeCalledWith('schedule.sessions', expect.any(Array))
      expect(store.put).toBeCalledWith('schedule.tracks', expect.any(Array))
      expect(store.put).toBeCalledWith('schedule.themes', expect.any(Array))
      expect(store.put).toBeCalledWith('schedule.speakers', expect.any(Array))
      expect(store.put).toBeCalledWith('schedule.types', expect.any(Array))
      expect(store.put).toBeCalledWith('schedule.settings', expect.any(Object))
      expect(store.put).toBeCalledWith('schedule.interpreters', [
        expect.objectContaining({
          id: 'interpreter-1',
          email: 'jess@example.com',
        }),
      ])
    })
  })
})

describe('#makeFixture', () => {
  it('should combine the base and options together and ', () => {
    const makePerson = makeFixture({ name: 'Geoff', age: 42 })

    const result = makePerson({ name: 'Jess' })

    expect(result).toEqual({ name: 'Jess', age: 42 })
  })
})
