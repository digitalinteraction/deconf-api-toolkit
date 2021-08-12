import {
  Attendance,
  AuthToken,
  ConfigSettings,
  Interpreter,
  Registration,
  Session,
  SessionSlot,
  SessionState,
  SessionType,
  SessionVisibility,
  Speaker,
  Theme,
  Track,
} from '@openlab/deconf-shared'

function makeFixture<T>(base: T) {
  return (options: Partial<T> = {}): T => {
    return { ...base, ...options }
  }
}

export const mockSession = makeFixture<Session>({
  id: 'session-a',
  type: 'plenary',
  slot: undefined,
  track: 'track-a',
  themes: ['theme-a', 'theme-b'],
  coverImage: undefined,
  title: { en: 'Session Title' },
  content: { en: 'Session Info' },
  links: [{ type: 'video', url: 'https://youtu.be', language: 'en' }],
  hostLanguages: ['en'],
  enableInterpretation: false,
  speakers: ['speaker-a', 'speaker-b', 'speaker-c'],
  hostOrganisation: { en: 'Host Organisation' },
  isRecorded: false,
  isOfficial: false,
  isFeatured: false,
  visibility: SessionVisibility.public,
  state: SessionState.confirmed,
  participantCap: null,
  proxyUrl: undefined,
  hideFromSchedule: false,
})

export const mockSlot = makeFixture<SessionSlot>({
  id: 'slot-a',
  start: new Date('2000-01-01T00:00:00.000Z'),
  end: new Date('3000-01-01T00:00:00.000Z'),
})

export const mockRegistration = makeFixture<Registration>({
  id: 1,
  created: new Date(),
  name: 'Geoff Testington',
  email: 'geoff@example.com',
  language: 'en',
  country: 'GB',
  affiliation: 'Open Lab',
  verified: true,
  consented: new Date(),
})

export const mockAuthToken = makeFixture<AuthToken>({
  kind: 'auth',
  sub: 1,
  user_roles: [],
  user_lang: 'en',
})

export const mockAttendance = makeFixture<Attendance>({
  id: 1,
  created: new Date(),
  attendee: 1,
  session: 'session-a',
})

export const mockTrack = makeFixture<Track>({
  id: 'track-a',
  title: {
    en: 'Track Title',
  },
})

export const mockTheme = makeFixture<Theme>({
  id: 'theme-a',
  title: {
    en: 'Theme Title',
  },
})

export const mockSpeaker = makeFixture<Speaker>({
  id: 'speaker-a',
  name: 'Speaker name',
  role: { en: 'Speaker Role' },
  bio: { en: 'Speaker Bio' },
  headshot: undefined,
})

export const mockSessionType = makeFixture<SessionType>({
  id: 'type-a',
  iconGroup: 'far',
  iconName: 'circle',
  layout: 'plenary',
  title: { en: 'Type Title' },
})

export const mockInterpreter = makeFixture<Interpreter>({
  id: 'interpreter-a',
  name: 'Jess Smith',
  email: 'jess@example.com',
})

export const mockSettings = makeFixture<ConfigSettings>({
  atrium: { enabled: true, visible: true },
  whatsOn: { enabled: true, visible: true },
  schedule: { enabled: true, visible: true },
  coffeeChat: { enabled: true, visible: true },
  helpDesk: { enabled: true, visible: true },
  startDate: new Date('2000-01-01T00:00:00.000Z'),
  endDate: new Date('3000-01-01T00:00:00.000Z'),
  isStatic: false,
})
