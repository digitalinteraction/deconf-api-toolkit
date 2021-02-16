import { mocked } from 'ts-jest/utils'
import {
  mockQueryService,
  mockConferenceService,
  mockUrlService,
} from '../../services/__mocks__'
import {
  ConfigSettings,
  Session,
  SessionState,
  SessionVisibility,
  AuthToken,
} from '@openlab/deconf-shared'
import { createScheduleModule } from '../schedule-module'
import ics = require('ics')

jest.mock('ics')

const thirtyMinutesInMs = 30 * 60 * 1000

function setup() {
  mocked(ics.createEvent).mockClear()

  const query = mockQueryService()
  const conference = mockConferenceService()
  const url = mockUrlService()
  const organiser = {
    name: 'Test organiser',
    email: 'host@example.com',
  }

  const authToken: AuthToken = {
    kind: 'auth',
    sub: 123,
    user_roles: ['attendee'],
    user_lang: 'en',
  }
  const fakeSession: Session = {
    id: 'games-intro',
    type: 'workshop',
    slot: '5',
    track: 'gaming',
    themes: ['tech'],
    coverImage: 'default.png',
    title: { en: 'Introduction to gaming' },
    content: { en: 'Lorem ipsum sil dor amet' },
    links: [
      { type: 'video', url: 'https://zoom.us/me/abcdefgh', language: 'en' },
    ],
    hostLanguages: ['en'],
    enableInterpretation: false,
    speakers: [],
    hostOrganisation: { en: 'Open Lab' },
    isRecorded: true,
    isOfficial: false,
    isFeatured: true,
    visibility: SessionVisibility.private,
    state: SessionState.accepted,
    hideFromSchedule: false,
    participantCap: null,
  }

  const settings: ConfigSettings = {
    atrium: { enabled: true, visible: false },
    whatsOn: { enabled: true, visible: false },
    schedule: { enabled: true, visible: false },
    coffeeChat: { enabled: true, visible: false },
    helpDesk: { enabled: true, visible: false },

    startDate: new Date(0),
    endDate: new Date(thirtyMinutesInMs),
    isStatic: false,
  }

  const schedule = createScheduleModule({ query, conference, url, organiser })
  return { query, conference, authToken, schedule, fakeSession, settings, url }
}

// ...
describe('generateIcs', () => {
  it('should return an ics file', async () => {
    const { schedule, conference, fakeSession, url, authToken } = setup()
    mocked(conference.findSession).mockResolvedValue(fakeSession)
    mocked(conference.getSlots).mockResolvedValue([
      { id: '5', start: new Date(0), end: new Date(thirtyMinutesInMs) },
    ])
    mocked(ics.createEvent).mockReturnValue({ value: 'fake_ics_file' })
    mocked(url.getSessionLink).mockReturnValue(
      new URL('http://example.com/event/games-intro')
    )

    const res = await schedule.generateIcs(authToken, 'games-intro')

    expect(conference.findSession).toBeCalledWith('games-intro')
    expect(ics.createEvent).toBeCalledWith({
      start: [1970, 1, 1, 0, 0],
      startInputType: 'utc',
      end: [1970, 1, 1, 0, 30],
      endInputType: 'utc',
      title: 'Introduction to gaming',
      description: 'Lorem ipsum sil dor amet',
      location: 'http://example.com/event/games-intro',
      organizer: {
        name: 'Test organiser',
        email: 'host@example.com',
      },
    })
    expect(res.status).toEqual(200)
    expect(res.headers).toEqual({
      'content-type': 'text/calendar',
      'content-disposition': 'attachment; filename="games-intro.ics"',
    })
  })
})

describe('getSessions', () => {
  it('should return sessions with attendance', async () => {
    const { schedule, conference, query, fakeSession } = setup()
    mocked(conference.getSessions).mockResolvedValue([fakeSession])
    mocked(query.getSessionAttendance).mockResolvedValue(
      new Map([['games-intro', 5]])
    )

    const res = await schedule.getSessions(null)

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({
      sessions: [
        {
          ...fakeSession,
          attendance: 5,
          links: [],
        },
      ],
    })
  })
  it('should have links if signed in', async () => {
    const { schedule, conference, query, fakeSession, authToken } = setup()
    mocked(conference.getSessions).mockResolvedValue([fakeSession])
    mocked(query.getSessionAttendance).mockResolvedValue(new Map())

    const res = await schedule.getSessions(authToken)

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({
      sessions: [
        {
          ...fakeSession,
          attendance: expect.any(Number),
          links: [
            {
              type: 'video',
              url: 'https://zoom.us/me/abcdefgh',
              language: 'en',
            },
          ],
        },
      ],
    })
  })
})

describe('getSettings', () => {
  it('should return conference settings', async () => {
    const { schedule, conference, settings } = setup()
    mocked(conference.getSettings).mockResolvedValue(settings)

    const res = await schedule.getSettings()

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({
      settings,
    })
  })
})

describe('getSlots', () => {
  it('should return slots', async () => {
    const { schedule, conference } = setup()
    mocked(conference.getSlots).mockResolvedValue([
      { id: '1', start: new Date(1611224630), end: new Date(1611224631) },
      { id: '2', start: new Date(1611224631), end: new Date(1611224632) },
      { id: '3', start: new Date(1611224632), end: new Date(1611224633) },
    ])

    const res = await schedule.getSlots()

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({
      slots: [
        { id: '1', start: new Date(1611224630), end: new Date(1611224631) },
        { id: '2', start: new Date(1611224631), end: new Date(1611224632) },
        { id: '3', start: new Date(1611224632), end: new Date(1611224633) },
      ],
    })
  })
})

describe('getSpeakers', () => {
  it('should return speakers', async () => {
    const { schedule, conference } = setup()
    mocked(conference.getSpeakers).mockResolvedValue([
      {
        id: '1',
        name: 'Geoff Testington',
        role: { en: 'CTO' },
        bio: { en: 'Hey' },
        headshot: 'default.png',
      },
    ])

    const res = await schedule.getSpeakers()

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({
      speakers: [
        {
          id: '1',
          name: 'Geoff Testington',
          role: { en: 'CTO' },
          bio: { en: 'Hey' },
          headshot: 'default.png',
        },
      ],
    })
  })
})

describe('getThemes', () => {
  it('should return themes', async () => {
    const { schedule, conference } = setup()
    mocked(conference.getThemes).mockResolvedValue([
      { id: 'a', title: { en: 'Test' } },
    ])

    const res = await schedule.getThemes()

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({
      themes: [{ id: 'a', title: { en: 'Test' } }],
    })
  })
})

describe('getTracks', () => {
  it('should return themes', async () => {
    const { schedule, conference } = setup()
    mocked(conference.getTracks).mockResolvedValue([
      { id: 'a', title: { en: 'Test' } },
    ])

    const res = await schedule.getTracks()

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({
      tracks: [{ id: 'a', title: { en: 'Test' } }],
    })
  })
})

describe('getTypes', () => {
  it('should return themes', async () => {
    const { schedule, conference } = setup()
    mocked(conference.getTypes).mockResolvedValue([
      {
        id: 'a',
        iconName: 'fas',
        iconGroup: 'users',
        layout: 'workshop',
        title: { en: 'Test' },
      },
    ])

    const res = await schedule.getTypes()

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({
      types: [
        {
          id: 'a',
          iconName: 'fas',
          iconGroup: 'users',
          layout: 'workshop',
          title: { en: 'Test' },
        },
      ],
    })
  })
})
