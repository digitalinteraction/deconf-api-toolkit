import { AuthToken } from '@openlab/deconf-shared'
import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'
import { VOID_RESPONSE } from '../lib/module'

type Context = Pick<
  DeconfBaseContext,
  'conferenceRepo' | 'registrationRepo' | 'attendanceRepo'
>

export class AttendanceRoutes {
  get #conferenceRepo() {
    return this.#context.conferenceRepo
  }
  get #registrationRepo() {
    return this.#context.registrationRepo
  }
  get #attendanceRepo() {
    return this.#context.attendanceRepo
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async #setup(authToken: AuthToken | null, sessionId: string) {
    if (!authToken) throw ApiError.unauthorized()

    const session = await this.#conferenceRepo.findSession(sessionId)
    if (!session) throw ApiError.notFound()

    const attendee = await this.#registrationRepo.getVerifiedRegistration(
      authToken.sub
    )
    if (!attendee) throw ApiError.unauthorized()

    return { session, attendee }
  }

  // POST /attend/:session_id
  async attend(authToken: AuthToken | null, sessionId: string) {
    const { session, attendee } = await this.#setup(authToken, sessionId)

    if (session.participantCap !== null) {
      const attendance = await this.#attendanceRepo.getSessionAttendance()
      const current = attendance.get(session.id) ?? 0

      if (current >= session.participantCap) {
        throw ApiError.badRequest()
      }
    }

    await this.#attendanceRepo.attend(attendee.id, sessionId)

    return VOID_RESPONSE
  }

  // POST /unattend/:session_id
  async unattend(authToken: AuthToken | null, sessionId: string) {
    const { session, attendee } = await this.#setup(authToken, sessionId)

    await this.#attendanceRepo.unattend(attendee.id, sessionId)

    return VOID_RESPONSE
  }

  // GET /attendance/:session_id
  async getSessionAttendance(authToken: AuthToken | null, sessionId: string) {
    const { attendee } = await this.#setup(authToken, sessionId)

    const attendance = await this.#attendanceRepo.getUserAttendance(attendee.id)

    const sessionAttendance = attendance.find((a) => a.session === sessionId)

    return {
      isAttending: Boolean(sessionAttendance),
      attendance: sessionAttendance || null,
    }
  }

  // GET /attendance/me
  async getUserAttendance(authToken: AuthToken | null) {
    if (!authToken) throw ApiError.unauthorized()

    return {
      attendance: await this.#attendanceRepo.getUserAttendance(authToken.sub),
    }
  }
}
