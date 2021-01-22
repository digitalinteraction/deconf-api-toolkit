import { EventEmitterService } from '../event-emitter-service'

export function mockEventEmitterService() {
  return {
    emit: jest.fn(),
    on: jest.fn(),
  }
}
