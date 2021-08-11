import { Attendance } from '@openlab/deconf-shared'
import { DeconfBaseContext } from '../lib/context'

interface SessionAttendance {
  session: string
  count: number
}

type Context = Pick<DeconfBaseContext, 'postgres'>

export class AttendanceRepository {
  get #postgres() {
    return this.#context.postgres
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  attend(attendee: number, session: string): Promise<void> {
    return this.#postgres.run(async (client) => {
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
    return this.#postgres.run(async (client) => {
      await client.sql`
        DELETE FROM attendance
        WHERE attendee=${attendee} AND session=${session}
      `
    })
  }

  async getSessionAttendance(): Promise<Map<string, number>> {
    const records = await this.#postgres.run(async (client) => {
      return client.sql<SessionAttendance>`
        SELECT session, count(*) as count
        FROM attendance
        GROUP BY session;
      `
    })

    // Return a map of { [session]: count }
    return new Map(records.map((r) => [r.session, r.count]))
  }

  getUserAttendance(attendee: number): Promise<Attendance[]> {
    return this.#postgres.run((client) => {
      return client.sql`
          SELECT id, created, attendee, session
          FROM attendance
          WHERE attendee=${attendee}
        `
    })
  }
}
