import { mocked } from 'ts-jest/utils'
import { EventEmitter } from 'events'
import { createEventEmitterService } from '../event-emitter-service'

jest.mock('events')

function setup() {
  mocked(EventEmitter).mockClear()

  const service = createEventEmitterService()
  return { service }
}

describe('emit', () => {
  it('should emit the event to the event emitter', () => {
    const { service } = setup()

    service.emit('test-event', 'payload')

    expect(mocked(EventEmitter).mock.instances[0].emit).toBeCalledWith(
      'test-event',
      'payload'
    )
  })
})

describe('on', () => {
  it('should register the event handler', () => {
    const { service } = setup()
    const spy = jest.fn()

    service.on('test-event', spy)

    expect(mocked(EventEmitter).mock.instances[0].on).toBeCalledWith(
      'test-event',
      spy
    )
  })
})
