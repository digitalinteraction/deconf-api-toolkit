import { Interpreter } from '@openlab/deconf-shared/dist'
import { is } from 'superstruct'
import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'
import { InterpretBooth, InterpretBoothStruct } from './interpret-booth-struct'

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

    return {
      auth: { authToken, email, interpreter },
      session: await this.#conferenceRepo.findSession(booth.sessionId),
      interpretRoom: `interpret/${booth.sessionId}/${booth.channel}`,
      channelRoom: `channel/${booth.sessionId}/${booth.channel}`,
    }
  }
}
