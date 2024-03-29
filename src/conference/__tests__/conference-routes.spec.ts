import { LocalisedLink, SessionState } from '@openlab/deconf-shared'
import { ApiError, createTestingDeconfConfig } from '../../lib/module.js'
import {
  mockAttendance,
  mockAttendanceRepository,
  mockAuthToken,
  mockConferenceRepository,
  mocked,
  mockSession,
  mockSessionType,
  mockSettings,
  mockSlot,
  mockSpeaker,
  mockTheme,
  mockTrack,
  mockUrlService,
} from '../../test-lib/module.js'
import { ConferenceRoutes } from '../conference-routes.js'

function setup() {
  const config = createTestingDeconfConfig()
  const url = mockUrlService()
  const attendanceRepo = mockAttendanceRepository()
  const conferenceRepo = mockConferenceRepository()
  const routes = new ConferenceRoutes({
    attendanceRepo,
    conferenceRepo,
    config,
    url,
  })
  return { routes, conferenceRepo, attendanceRepo, url, config }
}

describe('ConferenceRoutes', () => {
  describe('generateIcs', () => {
    it('should return an ics file', async () => {
      const { routes, conferenceRepo, url } = setup()
      mocked(conferenceRepo.findSession).mockResolvedValue(
        mockSession({
          id: 'session-a',
          slot: 'slot-a',
          title: { en: 'Session Title' },
          content: { en: 'Session Info' },
        })
      )
      mocked(conferenceRepo.getSlots).mockResolvedValue([
        mockSlot({ id: 'slot-a' }),
      ])
      mocked(url.getSessionLink).mockReturnValue(
        new URL('http://localhost:3000/session/session-a/ics')
      )

      const result = await routes.generateIcs('en', 'session-a')

      expect(result).toMatch('SUMMARY:Session Title')
      expect(result).toMatch('DESCRIPTION:Session Info')
      expect(result).toMatch(
        'LOCATION:http://localhost:3000/session/session-a/ics'
      )
      expect(result).toMatch('ORGANIZER;CN=Open Lab:mailto:support@example.com')
    })
  })

  describe('#getSchedule', () => {
    it('should return all schedule resources', async () => {
      const { routes, conferenceRepo } = setup()
      mocked(conferenceRepo.getSettings).mockResolvedValue(mockSettings())
      mocked(conferenceRepo.getSessions).mockResolvedValue([
        mockSession({ id: 'session-a' }),
      ])
      mocked(conferenceRepo.getSlots).mockResolvedValue([
        mockSlot({ id: 'slot-a' }),
      ])
      mocked(conferenceRepo.getThemes).mockResolvedValue([
        mockTheme({ id: 'theme-a' }),
      ])
      mocked(conferenceRepo.getTracks).mockResolvedValue([
        mockTrack({ id: 'track-a' }),
      ])
      mocked(conferenceRepo.getTypes).mockResolvedValue([
        mockSessionType({ id: 'type-a' }),
      ])
      mocked(conferenceRepo.getSpeakers).mockResolvedValue([
        mockSpeaker({ id: 'speaker-a' }),
      ])

      const result = await routes.getSchedule()

      expect(result).toEqual({
        slots: [expect.objectContaining({ id: 'slot-a' })],
        sessions: [expect.objectContaining({ id: 'session-a' })],
        themes: [expect.objectContaining({ id: 'theme-a' })],
        tracks: [expect.objectContaining({ id: 'track-a' })],
        types: [expect.objectContaining({ id: 'type-a' })],
        speakers: [expect.objectContaining({ id: 'speaker-a' })],
        settings: mockSettings(),
      })
    })
    it('should filter out unconfirmed sessions', async () => {
      const { routes, conferenceRepo } = setup()
      mocked(conferenceRepo.getSettings).mockResolvedValue(mockSettings())
      mocked(conferenceRepo.getSlots).mockResolvedValue([])
      mocked(conferenceRepo.getThemes).mockResolvedValue([])
      mocked(conferenceRepo.getTracks).mockResolvedValue([])
      mocked(conferenceRepo.getTypes).mockResolvedValue([])
      mocked(conferenceRepo.getSpeakers).mockResolvedValue([])
      mocked(conferenceRepo.getSessions).mockResolvedValue([
        mockSession({ id: 'session-a', state: SessionState.confirmed }),
        mockSession({ id: 'session-b', state: SessionState.confirmed }),
        mockSession({ id: 'session-c', state: SessionState.cancelled }),
        mockSession({ id: 'session-d', state: SessionState.rejected }),
        mockSession({ id: 'session-e', state: SessionState.accepted }),
        mockSession({ id: 'session-f', state: SessionState.draft }),
      ])

      const result = await routes.getSchedule()

      expect(result.sessions).toHaveLength(2)
    })
  })

  describe('#getLinks', () => {
    it('should return links with no participation cap', async () => {
      const { routes, conferenceRepo, attendanceRepo } = setup()
      const authToken = mockAuthToken({ sub: 1 })
      mocked(conferenceRepo.findSession).mockResolvedValue(
        mockSession({
          id: 'session-a',
          slot: 'slot-a',
          links: [{ type: 'video', url: 'https://youtu.be', language: 'en' }],
        })
      )
      mocked(conferenceRepo.getSlots).mockResolvedValue([
        mockSlot({ id: 'slot-a' }),
      ])

      const result = await routes.getLinks(authToken, 'session-a')

      expect(result).toEqual({
        links: [{ type: 'video', url: 'https://youtu.be', language: 'en' }],
      })
    })
    it('should return links to registered attendees when there is a cap', async () => {
      const { routes, conferenceRepo, attendanceRepo } = setup()
      const authToken = mockAuthToken({ sub: 1 })
      mocked(conferenceRepo.findSession).mockResolvedValue(
        mockSession({
          id: 'session-a',
          slot: 'slot-a',
          participantCap: 30,
          links: [{ type: 'video', url: 'https://youtu.be', language: 'en' }],
        })
      )
      mocked(conferenceRepo.getSlots).mockResolvedValue([
        mockSlot({ id: 'slot-a' }),
      ])
      mocked(attendanceRepo.getUserAttendance).mockResolvedValue([
        mockAttendance({ attendee: 1, session: 'session-a' }),
      ])

      const result = await routes.getLinks(authToken, 'session-a')

      expect(result).toEqual({
        links: [{ type: 'video', url: 'https://youtu.be', language: 'en' }],
      })
    })
    it('should always return links to admins', async () => {
      const { routes, conferenceRepo } = setup()
      const authToken = mockAuthToken({ sub: 1, user_roles: ['admin'] })
      mocked(conferenceRepo.findSession).mockResolvedValue(
        mockSession({
          id: 'session-a',
          slot: 'slot-a',
          participantCap: 30,
          links: [{ type: 'video', url: 'https://youtu.be', language: 'en' }],
        })
      )
      mocked(conferenceRepo.getSlots).mockResolvedValue([
        mockSlot({ id: 'slot-a' }),
      ])

      const result = await routes.getLinks(authToken, 'session-a')

      expect(result).toEqual({
        links: [{ type: 'video', url: 'https://youtu.be', language: 'en' }],
      })
    })
    it('should not return links 30m before the session', async () => {
      const { routes, conferenceRepo, attendanceRepo } = setup()
      const authToken = mockAuthToken({ sub: 1 })
      mocked(conferenceRepo.findSession).mockResolvedValue(
        mockSession({
          id: 'session-a',
          slot: 'slot-a',
          participantCap: 30,
          links: [{ type: 'video', url: 'https://youtu.be', language: 'en' }],
        })
      )
      mocked(conferenceRepo.getSlots).mockResolvedValue([
        mockSlot({
          id: 'slot-a',
          start: new Date('3000-01-01T00:00:00.000Z'),
        }),
      ])
      mocked(attendanceRepo.getUserAttendance).mockResolvedValue([
        mockAttendance({ attendee: 1, session: 'session-a' }),
      ])

      const result = routes.getLinks(authToken, 'session-a')

      await expect(result).rejects.toThrow(ApiError)
    })
  })

  describe('#lintSessions', () => {
    it('should lint for links, types and themes', async () => {
      const { routes, conferenceRepo } = setup()
      const links: LocalisedLink[] = [
        { type: 'video', url: 'https://youtu.be', language: 'en' },
      ]
      mocked(conferenceRepo.getSessions).mockResolvedValue([
        mockSession({
          id: 'session-a',
          type: 'unknown',
          track: 'track-a',
          slot: 'slot-a',
          links,
        }),
        mockSession({
          id: 'session-b',
          type: 'type-a',
          track: 'unknown',
          slot: 'slot-a',
          links,
        }),
        mockSession({
          id: 'session-c',
          type: 'type-a',
          track: 'track-a',
          slot: 'slot-a',
          links: [],
        }),
        mockSession({
          id: 'session-d',
          type: 'type-a',
          track: 'track-a',
          state: SessionState.confirmed,
          slot: undefined,
        }),
      ])
      mocked(conferenceRepo.getTypes).mockResolvedValue([
        mockSessionType({ id: 'type-a' }),
      ])
      mocked(conferenceRepo.getTracks).mockResolvedValue([
        mockSessionType({ id: 'track-a' }),
      ])

      const result = await routes.lintSessions()

      expect(result).toEqual([
        {
          kind: 'bad-type',
          title: 'Bad type',
          subtitle: expect.any(String),
          messages: [expect.stringContaining('session-a')],
        },
        {
          kind: 'bad-track',
          title: 'Bad track',
          subtitle: expect.any(String),
          messages: [expect.stringContaining('session-b')],
        },
        {
          kind: 'no-links',
          title: 'No links',
          subtitle: expect.any(String),
          messages: [expect.stringContaining('session-c')],
        },
        {
          kind: 'no-slot',
          title: 'Not scheduled',
          subtitle: expect.any(String),
          messages: [expect.stringContaining('session-d')],
        },
      ])
    })
  })
})
