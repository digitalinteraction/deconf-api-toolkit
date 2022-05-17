import { Attendance } from '@openlab/deconf-shared'
import { DeconfBaseContext } from '../lib/context'

interface RawSessionAttendance {
  session: string
  count: string
}

type Context = Pick<DeconfBaseContext, 'postgres'>

/**
 * `AttendanceRepository` provides logic for storing and retrieving session interest in the database.
 * 
 * ```ts
 * const postgres: PostgresService
 * 
 * const attendanceRepo = new AttendanceRepository({
 *   postgres,
 * })
```
 */
export class AttendanceRepository {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  /**
   * `attend` marks an attendee as interested in a session from the attendee and session's ids.
   * The attendee's id is most likely to come from an `AuthToken`'s `sub` property.
   *
   * ```ts
   * await attendanceRepo.attend(5, 'session-a')
   * ```
   */
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

  /**
   * `unattend` is the opposite of `attend`,
   * it removes any interest records for an attendee and a given session.
   *
   * ```ts
   * await attendanceRepo.unattend(5, 'session-a')
   * ```
   */
  unattend(attendee: number, session: string): Promise<void> {
    return this.#context.postgres.run(async (client) => {
      await client.sql`
        DELETE FROM attendance
        WHERE attendee=${attendee} AND session=${session}
      `
    })
  }

  /**
   * `getSessionAttendance` create a map of session id to the number of attendees interested in that session.
   *
   * ```ts
   * const sessionAttendance = await attendanceRepo.getSessionAttendance()
   *
   * sessionAttendance.get('session-a') // 5
   * ```
   */
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

  /**
   * `getUserAttendance` gets a list of the `Attendance` records that an attendee has created.
   *
   * ```ts
   * const userAttendance = await attendanceRepo.getUserAttendance()
   * ```
   */
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
