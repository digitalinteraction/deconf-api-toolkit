import {
  mockSession,
  mockAttendanceRepository,
  mockConferenceRepository,
  mockUrlService,
  mockAttendance,
  mockJwtService,
  mockAuthToken,
  mocked,
} from '../../test-lib/module.js'

import {
  CalendarRoutes,
  getGoogleDate,
  getIcsDate,
  getSessionIcsAttributes,
} from '../calendar-routes.js'
import { mockSlot } from '../mock-schedule-command.js'

function setup() {
  const jwt = mockJwtService()
  const url = mockUrlService()
  const attendanceRepo = mockAttendanceRepository()
  const conferenceRepo = mockConferenceRepository()
  const routes = new CalendarRoutes({
    jwt,
    url,
    attendanceRepo,
    conferenceRepo,
  })
  return { routes, jwt, url, attendanceRepo, conferenceRepo }
}

describe('getIcsDate', () => {
  it('should format a date for ICS files', async () => {
    const input = new Date('2022-01-02T12:34:56.789Z')
    const result = getIcsDate(input)
    expect(result).toEqual([2022, 1, 2, 12, 34])
  })
})

describe('getGoogleDate', () => {
  it('should format a date for google calendar', async () => {
    const input = new Date('2022-01-02T12:34:56.789Z')
    const result = getGoogleDate(input)
    expect(result).toEqual('20220102T123456Z')
  })
})

describe('getSessionIcsAttributes', () => {
  it('should convert session properties into ics EventAttributes', async () => {
    const session = mockSession({
      id: 'session-a',
      title: { en: 'Session Title' },
      content: { en: 'Session Content' },
    })
    const slot = mockSlot({
      id: 'slot-a',
      start: new Date('2022-01-01T12:30:00.000Z'),
      end: new Date('2022-01-01T13:00:00.000Z'),
    })
    const url = new URL('http://localhost:8080/session/session-a')

    const result = getSessionIcsAttributes('en', session, slot, url)

    expect(result).toEqual({
      start: [2022, 1, 1, 12, 30],
      startInputType: 'utc',
      end: [2022, 1, 1, 13, 0],
      endInputType: 'utc',
      title: 'Session Title',
      description: 'Session Content',
      location: 'http://localhost:8080/session/session-a',
    })
  })
})

describe('CalendarRoutes', () => {
  describe('getSessionIcsFile', () => {
    it('should generate an ics file', async () => {
      const { routes, conferenceRepo, url } = setup()
      mocked(conferenceRepo.findSession).mockResolvedValue(
        mockSession({
          id: 'session-a',
          slot: 'slot-a',
          title: { en: 'Session Title' },
          content: { en: 'Session Content' },
        })
      )
      mocked(conferenceRepo.getSlots).mockResolvedValue([
        mockSlot({ id: 'slot-a' }),
      ])
      mocked(url.getSessionLink).mockReturnValue(
        new URL('http://localhost:3000/session/session-a')
      )

      const result = await routes.getSessionIcsFile('en', 'session-a')

      expect(result).toMatch('SUMMARY:Session Title')
      expect(result).toMatch('DESCRIPTION:Session Content')
      expect(result).toMatch('LOCATION:http://localhost:3000/session/session-a')
    })
  })

  describe('#getGoogleCalendarUrl', () => {
    it('should return a URL to create the event', async () => {
      const { routes, conferenceRepo, url, attendanceRepo } = setup()
      mocked(conferenceRepo.findSession).mockResolvedValue(
        mockSession({
          id: 'session-a',
          slot: 'slot-a',
          title: { en: 'Session Title' },
          content: { en: 'Session Content' },
        })
      )
      mocked(conferenceRepo.getSlots).mockResolvedValue([
        mockSlot({
          id: 'slot-a',
          start: new Date('2022-01-01T12:30:00.000Z'),
          end: new Date('2022-01-01T13:00:00.000Z'),
        }),
      ])
      mocked(url.getSessionLink).mockReturnValue(
        new URL('http://localhost:3000/session/session-a')
      )

      const result = await routes.getGoogleCalendarUrl('en', 'session-a')

      expect(result.origin).toEqual('https://calendar.google.com')
      expect(result.pathname).toEqual('/event')
      expect(result.searchParams.get('action')).toEqual('TEMPLATE')
      expect(result.searchParams.get('dates')).toEqual(
        '20220101T123000Z/20220101T130000Z'
      )
      expect(result.searchParams.get('text')).toEqual('Session Title')
      expect(result.searchParams.get('location')).toEqual(
        'http://localhost:3000/session/session-a'
      )
    })
  })

  describe('#getUserIcs', () => {
    it('should generate an ics file with user events', async () => {
      const { routes, conferenceRepo, url, attendanceRepo } = setup()
      mocked(conferenceRepo.getSessions).mockResolvedValue([
        mockSession({
          id: 'session-a',
          slot: 'slot-a',
          title: { en: 'Session A Title' },
          content: { en: 'Session A Content' },
        }),
        mockSession({
          id: 'session-b',
          slot: 'slot-b',
          title: { en: 'Session B Title' },
          content: { en: 'Session B Content' },
        }),
      ])
      mocked(conferenceRepo.getSlots).mockResolvedValue([
        mockSlot({
          id: 'slot-a',
          start: new Date('2022-01-01T12:30:00.000Z'),
          end: new Date('2022-01-01T13:00:00.000Z'),
        }),
        mockSlot({
          id: 'slot-b',
          start: new Date('2022-01-02T12:30:00.000Z'),
          end: new Date('2022-01-02T13:00:00.000Z'),
        }),
      ])
      mocked(url.getSessionLink).mockReturnValue(
        new URL('http://localhost:3000/session/session-a')
      )
      mocked(attendanceRepo.getUserAttendance).mockResolvedValue([
        mockAttendance({ session: 'session-a' }),
        mockAttendance({ session: 'session-b' }),
      ])

      const result = await routes.getUserIcs({
        kind: 'user-ical',
        sub: 1,
        user_lang: 'en',
      })

      expect(result).toMatch('SUMMARY:Session A Title')
      expect(result).toMatch('SUMMARY:Session B Title')
    })
  })

  describe('createUserCalendar', () => {
    it('should return a url with the user-ical token in it', async () => {
      const { routes, jwt } = setup()
      const authToken = mockAuthToken({ sub: 1, user_lang: 'fr' })
      mocked(jwt.signToken).mockReturnValue('user-ical-token')

      const result = routes.createUserCalendar(
        authToken,
        (token) => new URL(`http://localhost/user-ical/${token}`)
      )

      expect(result.url.toString()).toEqual(
        'http://localhost/user-ical/user-ical-token'
      )
    })
  })
})
