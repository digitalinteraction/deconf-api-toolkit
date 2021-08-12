import { DeconfBaseContext } from '../lib/context'

interface TrackOptions {
  attendee?: number
  socket?: string
}

type Context = Pick<DeconfBaseContext, 'postgres'>

export class MetricsRepository {
  get #postgres() {
    return this.#context.postgres
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async trackEvent(eventName: string, data: any, options: TrackOptions = {}) {
    this.#postgres.run(async (client) => {
      const { attendee = null, socket = null } = options
      await client.sql`
        INSERT INTO logs (event, attendee, socket, data)
        VALUES (${eventName}, ${attendee}, ${socket}, ${data})
      `
    })
  }
}
