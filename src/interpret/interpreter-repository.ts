import { InterpretBooth } from '@openlab/deconf-shared'
import { is } from 'superstruct'
import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'
import { InterpretBoothStruct } from './interpret-booth-struct'

type Context = Pick<DeconfBaseContext, 'jwt' | 'conferenceRepo'>

export class InterpreterRepository {
  get #jwt() {
    return this.#context.jwt
  }
  get #conferenceRepo() {
    return this.#context.conferenceRepo
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async prepInterpreter(socketId: string, booth: InterpretBooth) {
    if (!is(booth, InterpretBoothStruct)) throw ApiError.badRequest()

    const { authToken, email, interpreter } = await this.#jwt.getSocketAuth(
      socketId
    )
    if (!interpreter) throw ApiError.unauthorized()

    const session = await this.#conferenceRepo.findSession(booth.sessionId)
    if (!session) {
      throw new ApiError(400, ['interpret.invalidSession'])
    }

    if (!session.hostLanguages.includes(booth.channel)) {
      throw new ApiError(400, ['interpret.invalidChannel'])
    }

    return {
      auth: { authToken, email, interpreter },
      session: session,
      interpretRoom: `interpret/${booth.sessionId}/${booth.channel}`,
      channelRoom: `channel/${booth.sessionId}/${booth.channel}`,
    }
  }
}
