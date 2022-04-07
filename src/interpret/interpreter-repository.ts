import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'
import { assertStruct } from '../lib/module'
import { InterpretBoothStruct } from './interpret-booth-struct'

type Context = Pick<DeconfBaseContext, 'jwt' | 'conferenceRepo'>

export class InterpreterRepository {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async prepInterpreter(socketId: string, booth: unknown) {
    assertStruct(booth, InterpretBoothStruct)

    const {
      authToken,
      email,
      interpreter,
    } = await this.#context.jwt.getSocketAuth(socketId)
    if (!interpreter) throw ApiError.unauthorized()

    const session = await this.#context.conferenceRepo.findSession(
      booth.sessionId
    )
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
