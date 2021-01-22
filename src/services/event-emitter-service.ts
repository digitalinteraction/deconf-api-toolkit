import EventEmitter = require('events')

// This *should* have been refactored out with email service

export interface EventEmitterEvent<
  N extends string = string,
  T extends any = any
> {
  name: N
  payload: T
}

export interface EventEmitterService {
  emit<T extends EventEmitterEvent>(
    eventName: T['name'],
    payload: T['payload']
  ): void
  on<T extends EventEmitterEvent>(
    eventName: string,
    callback: (payload: T['payload']) => void
  ): void
}

export function createEventEmitterService(): EventEmitterService {
  const events = new EventEmitter()

  return {
    emit(eventName, ...args) {
      events.emit(eventName, ...args)
    },
    on(eventName, callback) {
      events.on(eventName, callback)
    },
  }
}
