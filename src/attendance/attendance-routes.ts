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

/**
 * `AttendanceRoutes` provides routes for adding, removing and querying attendee attendance.
 *
 * ```ts
 * const conferenceRepo: ConferenceRepository
 * const registrationRepo: RegistrationRepository
 * const attendanceRepo: AttendanceRepository
 * const jwt: JwtService
 *
 * const app = express().use(express.json())
 *
 * const attendanceRoutes = new AttendanceRoutes({
 *   conferenceRepo,
 *   registrationRepo,
 *   attendanceRepo,
 * })
 * ```
 *
 * These general errors might occur with any of the `AttendanceRoutes`:
 *
 * - `general.unauthorized` — the authToken was missing or not verified
 * - `general.notFound` — the related session does not exist
 */
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

  /**
   * `attend` marks a user as attending/interested in a session.
   *
   * Extra potential errors:
   *
   * - `general.badRequest` — the session has met it's participation cap
   *
   * ```ts
   * app.post('/attendance/attend/:sessionId', async (req, res) => {
   *   res.send(
   *     await attendanceRoutes.attend(
   *       jwt.getRequestAuth(req.headers),
   *       req.params.sessionId
   *     )
   *   )
   * })
   * ```
   */
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

  /**
   * `unattend` remove's an attendee's attendance/interest in a session.
   *
   * ```ts
   * app.post('/attendance/unattend/:sessionId', async (req, res) => {
   *   res.send(
   *     await attendanceRoutes.unattend(
   *       jwt.getRequestAuth(req.headers),
   *       req.params.sessionId
   *     )
   *   )
   * })
   * ```
   */
  async unattend(
    authToken: AuthToken | null,
    sessionId: string
  ): Promise<VoidResponse> {
    const { attendee } = await this.#setup(authToken, sessionId)

    await this.#context.attendanceRepo.unattend(attendee.id, sessionId)

    return VOID_RESPONSE
  }

  /**
   * `getSessionAttendance` gets the attendance for a session and whether the current user is attending it.
   *
   * ```ts
   * app.get('/attendance/session/:sessionId', async (req, res) => {
   *   res.send(
   *     await attendanceRoutes.getSessionAttendance(
   *       jwt.getRequestAuth(req.headers),
   *       req.params.sessionId
   *     )
   *   )
   * })
   * ```
   */
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

  /**
   * `getUserAttendance` fetches the sessions an attendee is attending.
   *
   * ```ts
   * app.get('/attendance/me', async (req, res) => {
   *   res.send(
   *     await attendanceRoutes.getUserAttendance(jwt.getRequestAuth(req.headers))
   *   )
   * })
   * ```
   */
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
