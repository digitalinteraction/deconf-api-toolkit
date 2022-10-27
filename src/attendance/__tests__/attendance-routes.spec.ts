import {
  mockAttendance,
  mockAttendanceRepository,
  mockAuthToken,
  mockConferenceRepository,
  mockRegistration,
  mockRegistrationRepository,
  mockSession,
  VOID_RESPONSE,
  mocked,
} from '../../test-lib/module.js'
import { AttendanceRoutes } from '../attendance-routes.js'

const SESSION_ID = 'session-a'
const ATTENDEE_ID = 1

function setup() {
  const conferenceRepo = mockConferenceRepository()
  const registrationRepo = mockRegistrationRepository()
  const attendanceRepo = mockAttendanceRepository()
  const routes = new AttendanceRoutes({
    conferenceRepo,
    registrationRepo,
    attendanceRepo,
  })
  const session = mockSession({ id: SESSION_ID, participantCap: 30 })
  const registration = mockRegistration({ id: ATTENDEE_ID })
  const token = mockAuthToken({ sub: ATTENDEE_ID })
  return {
    conferenceRepo,
    registrationRepo,
    attendanceRepo,
    routes,
    session,
    registration,
    token,
  }
}

describe('AttendanceRoutes', () => {
  describe('#attend', () => {
    it('should return a VOID_RESPONSE', async () => {
      const {
        conferenceRepo,
        registrationRepo,
        routes,
        attendanceRepo,
        token,
        session,
        registration,
      } = setup()
      mocked(conferenceRepo.findSession).mockResolvedValue(session)
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValue(
        registration
      )
      mocked(attendanceRepo.getSessionAttendance).mockResolvedValue(
        new Map([[SESSION_ID, 10]])
      )

      const result = await routes.attend(token, SESSION_ID)

      expect(result).toEqual(VOID_RESPONSE)
    })
    it('should request to attend', async () => {
      const {
        conferenceRepo,
        registrationRepo,
        routes,
        attendanceRepo,
        token,
        session,
        registration,
      } = setup()
      mocked(conferenceRepo.findSession).mockResolvedValue(session)
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValue(
        registration
      )
      mocked(attendanceRepo.getSessionAttendance).mockResolvedValue(
        new Map([[SESSION_ID, 10]])
      )

      await routes.attend(token, SESSION_ID)

      expect(attendanceRepo.attend).toBeCalledWith(ATTENDEE_ID, SESSION_ID)
    })
  })

  describe('#unattend', () => {
    it('should return a VOID_RESPONSE', async () => {
      const {
        conferenceRepo,
        registrationRepo,
        routes,
        session,
        registration,
        token,
      } = setup()

      mocked(conferenceRepo.findSession).mockResolvedValue(session)
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValue(
        registration
      )

      const result = await routes.unattend(token, SESSION_ID)

      expect(result).toEqual(VOID_RESPONSE)
    })
    it('should request to unattend', async () => {
      const {
        conferenceRepo,
        registrationRepo,
        routes,
        attendanceRepo,
        session,
        registration,
        token,
      } = setup()

      mocked(conferenceRepo.findSession).mockResolvedValue(session)
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValue(
        registration
      )

      await routes.unattend(token, SESSION_ID)

      expect(attendanceRepo.unattend).toBeCalledWith(ATTENDEE_ID, SESSION_ID)
    })
  })

  describe('#getSessionAttendance', () => {
    it('should return if they are attending and the record', async () => {
      const {
        conferenceRepo,
        registrationRepo,
        routes,
        attendanceRepo,
        session,
        registration,
        token,
      } = setup()

      mocked(conferenceRepo.findSession).mockResolvedValue(session)
      mocked(registrationRepo.getVerifiedRegistration).mockResolvedValue(
        registration
      )
      mocked(attendanceRepo.getUserAttendance).mockResolvedValue([
        mockAttendance({ attendee: ATTENDEE_ID, session: SESSION_ID }),
      ])
      mocked(attendanceRepo.getSessionAttendance).mockResolvedValue(
        new Map([[SESSION_ID, 42]])
      )

      const result = await routes.getSessionAttendance(token, SESSION_ID)

      expect(result).toEqual({
        isAttending: true,
        sessionCount: 42,
      })
    })
  })

  describe('#getUserAttendance', () => {
    it("should return a user's attendance", async () => {
      const { routes, attendanceRepo, token } = setup()
      mocked(attendanceRepo.getUserAttendance).mockResolvedValue([
        mockAttendance({ attendee: ATTENDEE_ID, session: 'session-a' }),
        mockAttendance({ attendee: ATTENDEE_ID, session: 'session-b' }),
        mockAttendance({ attendee: ATTENDEE_ID, session: 'session-c' }),
      ])

      const result = await routes.getUserAttendance(token)

      expect(result).toEqual({
        attendance: [
          expect.objectContaining({ session: 'session-a' }),
          expect.objectContaining({ session: 'session-b' }),
          expect.objectContaining({ session: 'session-c' }),
        ],
      })
    })
  })
})
