import {
  AuthToken,
  UserAttendance,
  UserSessionAttendance,
} from '@openlab/deconf-shared'
import {
  VOID_RESPONSE,
  DeconfBaseContext,
  ApiError,
  VoidResponse,
} from '../lib/module'

type Context = Pick<
  DeconfBaseContext,
  'conferenceRepo' | 'registrationRepo' | 'attendanceRepo'
>

export class AttendanceRoutes {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async #setup(authToken: AuthToken | null, sessionId: string) {
    if (!authToken) throw ApiError.unauthorized()

    const session = await this.#context.conferenceRepo.findSession(sessionId)
    if (!session) throw ApiError.notFound()

    const attendee = await this.#context.registrationRepo.getVerifiedRegistration(
      authToken.sub
    )
    if (!attendee) throw ApiError.unauthorized()

    return { session, attendee }
  }

  // POST /attend/:session_id
  async attend(
    authToken: AuthToken | null,
    sessionId: string
  ): Promise<VoidResponse> {
    const { session, attendee } = await this.#setup(authToken, sessionId)

    if (session.participantCap !== null) {
      const attendance = await this.#context.attendanceRepo.getSessionAttendance()
      const current = attendance.get(session.id) ?? 0

      if (current >= session.participantCap) {
        throw ApiError.badRequest()
      }
    }

    await this.#context.attendanceRepo.attend(attendee.id, sessionId)

    return VOID_RESPONSE
  }

  // POST /unattend/:session_id
  async unattend(
    authToken: AuthToken | null,
    sessionId: string
  ): Promise<VoidResponse> {
    const { attendee } = await this.#setup(authToken, sessionId)

    await this.#context.attendanceRepo.unattend(attendee.id, sessionId)

    return VOID_RESPONSE
  }

  // GET /attendance/:session_id
  async getSessionAttendance(
    authToken: AuthToken | null,
    sessionId: string
  ): Promise<UserSessionAttendance> {
    const { attendee } = await this.#setup(authToken, sessionId)

    const userAttendance = await this.#context.attendanceRepo.getUserAttendance(
      attendee.id
    )

    const sessionAttendance = await this.#context.attendanceRepo.getSessionAttendance()

    return {
      isAttending: userAttendance.some((a) => a.session === sessionId),
      sessionCount: sessionAttendance.get(sessionId) ?? 0,
    }
  }

  // GET /attendance/me
  async getUserAttendance(
    authToken: AuthToken | null
  ): Promise<UserAttendance> {
    if (!authToken) throw ApiError.unauthorized()

    const attendance = await this.#context.attendanceRepo.getUserAttendance(
      authToken.sub
    )
    return { attendance }
  }
}
