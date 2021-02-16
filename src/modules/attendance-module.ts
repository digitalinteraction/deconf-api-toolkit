import { QueryService, ConferenceService } from '../services'
import { HttpResponse } from '../http-response'
import { AuthToken } from '@openlab/deconf-shared'

export interface AttendanceModule {
  // POST /attend/:session_id
  attend(authToken: AuthToken | null, sessionId: string): Promise<HttpResponse>

  // POST /unattend/:session_id
  unattend(
    authToken: AuthToken | null,
    sessionId: string
  ): Promise<HttpResponse>

  // GET /attendance/:session_id
  getAttendance(
    authToken: AuthToken | null,
    sessionId: string
  ): Promise<HttpResponse>
}

export interface AttendanceModuleOptions {
  conference: ConferenceService
  query: QueryService
}

export function createAttendanceModule({
  conference,
  query,
}: AttendanceModuleOptions): AttendanceModule {
  return {
    async attend(authToken, sessionId) {
      if (!authToken) return HttpResponse.unauthorized()

      const session = await conference.findSession(sessionId)
      if (!session) return HttpResponse.notFound()

      const attendee = await query.getVerifiedRegistration(authToken.sub)
      if (!attendee) return HttpResponse.unauthorized()

      if (session.participantCap !== null) {
        const attendance = await query.getSessionAttendance()
        const current = attendance.get(session.id) ?? 0

        if (current >= session.participantCap) {
          return HttpResponse.badRequest()
        }
      }

      await query.attend(attendee.id, sessionId)

      return new HttpResponse(200)
    },
    async unattend(authToken, sessionId) {
      if (!authToken) return HttpResponse.unauthorized()

      const session = await conference.findSession(sessionId)
      if (!session) return HttpResponse.notFound()

      const attendee = await query.getVerifiedRegistration(authToken.sub)
      if (!attendee) return HttpResponse.unauthorized()

      await query.unattend(attendee.id, sessionId)

      return new HttpResponse(200)
    },
    async getAttendance(authToken, sessionId) {
      if (!authToken) return HttpResponse.unauthorized()

      const session = await conference.findSession(sessionId)
      if (!session) return HttpResponse.notFound()

      const attendee = await query.getVerifiedRegistration(authToken.sub)
      if (!attendee) return HttpResponse.unauthorized()

      const attendance = await query.getUserAttendance(attendee.id)

      const sessionAttendance = attendance.find((a) => a.session === sessionId)

      return new HttpResponse(200, {
        isAttending: Boolean(sessionAttendance),
        attendance: sessionAttendance || null,
      })
    },
  }
}
