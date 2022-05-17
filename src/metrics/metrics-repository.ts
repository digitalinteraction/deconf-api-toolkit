import { DeconfBaseContext } from '../lib/context'

/** Extra data to link to a logged metric */
export interface MetricsTrackOptions {
  attendee?: number
  socket?: string
}

type Context = Pick<DeconfBaseContext, 'postgres'>

export class MetricsRepository {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async trackEvent(
    eventName: string,
    data: any,
    options: MetricsTrackOptions = {}
  ) {
    this.#context.postgres.run(async (client) => {
      const { attendee = null, socket = null } = options
      await client.sql`
        INSERT INTO logs (event, attendee, socket, data)
        VALUES (${eventName}, ${attendee}, ${socket}, ${data})
      `
    })
  }
}
