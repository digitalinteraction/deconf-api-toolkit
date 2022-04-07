import { Attendance } from '@openlab/deconf-shared'
import { DeconfBaseContext } from '../lib/context'

interface RawSessionAttendance {
  session: string
  count: string
}

type Context = Pick<DeconfBaseContext, 'postgres'>

export class AttendanceRepository {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  attend(attendee: number, session: string): Promise<void> {
    return this.#context.postgres.run(async (client) => {
      const result = await client.sql`
        SELECT FROM attendance
        WHERE attendee=${attendee} AND session=${session}
      `

      if (result.length > 0) return

      await client.sql`
        INSERT INTO attendance (attendee, session)
        VALUES (${attendee}, ${session})
      `
    })
  }

  unattend(attendee: number, session: string): Promise<void> {
    return this.#context.postgres.run(async (client) => {
      await client.sql`
        DELETE FROM attendance
        WHERE attendee=${attendee} AND session=${session}
      `
    })
  }

  async getSessionAttendance(): Promise<Map<string, number>> {
    const records = await this.#context.postgres.run(async (client) => {
      return client.sql<RawSessionAttendance>`
        SELECT session, CAST(count(*) as INT) as count
        FROM attendance
        GROUP BY session;
      `
    })

    // Return a map of { [session]: count }
    return new Map(records.map((r) => [r.session, parseInt(r.count, 10)]))
  }

  getUserAttendance(attendee: number): Promise<Attendance[]> {
    return this.#context.postgres.run((client) => {
      return client.sql`
          SELECT id, created, attendee, session
          FROM attendance
          WHERE attendee=${attendee}
        `
    })
  }
}
