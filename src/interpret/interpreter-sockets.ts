import { Interpreter } from '@openlab/deconf-shared'
import { enums, is, object, string } from 'superstruct'
import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'
import { InterpretBooth } from './interpret-booth-struct'

type Context = Pick<
  DeconfBaseContext,
  'sockets' | 'interpreterRepo' | 'metricsRepo' | 'jwt'
>

export class InterpreterSockets {
  get #sockets() {
    return this.#context.sockets
  }
  get #interpreterRepo() {
    return this.#context.interpreterRepo
  }
  get #jwt() {
    return this.#context.jwt
  }
  get #metricsRepo() {
    return this.#context.metricsRepo
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  // Events
  async socketDisconnected(socketId: string) {
    const rooms = await this.#sockets.getSocketRooms(socketId)

    const auth = await this.#jwt.getSocketAuth(socketId)
    if (!auth || !auth.interpreter) throw ApiError.unauthorized()

    const interpretRooms = Array.from(rooms).filter((room) =>
      room.startsWith('interpret/')
    )

    for (const room of interpretRooms) {
      this.#sockets.emitTo(room, 'interpret-left', auth.interpreter)
    }

    // if an interpreter -> interpret-left
    // from join-interpret
  }

  // Interpret
  async acceptInterpret(socketId: string, booth: InterpretBooth) {
    const { auth, interpretRoom } = await this.#interpreterRepo.prepInterpreter(
      socketId,
      booth
    )

    this.#sockets.emitTo(interpretRoom, 'interpret-accepted', auth.interpreter)

    await this.#metricsRepo.trackEvent('interpret-accepted', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }

  async joinBooth(socketId: string, booth: InterpretBooth) {
    // 1. emit the current room's occupants to the joiner
    // 2. emit the active interpreter to the joiner
    // 3. join the interpret room
    // 4. emit the join to the booth
    // 5. log an event
  }

  async leaveBooth(socketId: string, booth: InterpretBooth) {
    // 1. leave the interpreter room
    // 2. broadcast the leaving to the booth
    // 3. stop interpretation if active?
    // 4. log an event
  }

  async messageBooth(socketId: string, booth: InterpretBooth, message: string) {
    // 1. broadcast the message to the booth
  }

  async requestInterpret(
    socketId: string,
    booth: InterpretBooth,
    duration: number
  ) {
    // 1. broadcast the request to the booth
  }

  async sendAudio(socketId: string, rawData: Buffer) {
    // 1. get the booth packet
    // 2. broadcast the data to the channel
    // 3. upload the chunk to s3
  }

  async startInterpret(socketId: string, booth: InterpretBooth) {
    // 1. boot any existing interpreters
    // 2. store the booth packet
    // 3. broadcast the start to the booth
    // 4. broadcast the start to the channel
    // 5. log an event
  }

  async stopInterpret(socketId: string, booth: InterpretBooth) {
    // 1. get the booth packet
    // 2. remove the booth packet
    // 3. broadcast the stop to the booth
    // 4. broadcast the stop to the channel
    // 5. log an event
  }
}
