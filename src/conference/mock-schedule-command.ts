import {
  ConferenceConfig,
  Interpreter,
  Session,
  SessionSlot,
  SessionState,
  SessionType,
  SessionVisibility,
  Speaker,
  Theme,
  Track,
} from '@openlab/deconf-shared'
import createDebug from 'debug'
import { DeconfBaseContext } from '../lib/module'

const debug = createDebug('deconf:conference:mock-schedule')

export interface MockScheduleCommandOptions {
  interpreterEmails: string[]
}

type Context = Pick<DeconfBaseContext, 'store'>

export class MockScheduleCommand {
  get #store() {
    return this.#context.store
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async process(options: MockScheduleCommandOptions) {
    debug('Generate interpreters')
    const interpreters = options.interpreterEmails.map((email, i) =>
      mockInterpreter({
        id: `interpreter-${i + 1}`,
        email,
      })
    )

    debug('Create schedule')
    const schedule = getFakeSchedule()

    debug('Save to redis')
    await Promise.all([
      this.#store.put('schedule.slots', schedule.slots),
      this.#store.put('schedule.sessions', schedule.sessions),
      this.#store.put('schedule.tracks', schedule.tracks),
      this.#store.put('schedule.themes', schedule.themes),
      this.#store.put('schedule.speakers', schedule.speakers),
      this.#store.put('schedule.types', schedule.types),
      this.#store.put('schedule.settings', schedule.settings),
      this.#store.put('schedule.interpreters', interpreters),
    ])
  }
}

//
// Utils
//
function pickOne<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)]
}

function pickMany<T>(array: T[], count: number) {
  return array.slice(0, count).sort(() => (Math.random() > 0.5 ? -1 : 1))
}

function random(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min))
}

function getFakeSchedule() {
  const start = new Date()
  start.setHours(24, 0, 0, 0)

  const mockDate = (offset: number) => {
    const date = new Date(start)
    date.setMinutes(date.getMinutes() + offset)
    return date
  }

  const slots: SessionSlot[] = [
    mockSlot({ id: 'slot-a', start: mockDate(0), end: mockDate(60) }),
    mockSlot({ id: 'slot-b', start: mockDate(60), end: mockDate(150) }),
    mockSlot({ id: 'slot-c', start: mockDate(150), end: mockDate(180) }),
  ]

  const types: SessionType[] = [
    mockSessionType({ id: 'plenary', title: mockLocalised('Plenary') }),
    mockSessionType({
      id: 'workshop',
      title: mockLocalised('Workshop'),
      layout: 'workshop',
    }),
  ]

  const themes: Theme[] = [
    mockTheme({ id: 'theme-a', title: mockLocalised('Theme A') }),
    mockTheme({ id: 'theme-b', title: mockLocalised('Theme B') }),
    mockTheme({ id: 'theme-c', title: mockLocalised('Theme C') }),
    mockTheme({ id: 'theme-d', title: mockLocalised('Theme D') }),
  ]

  const tracks: Track[] = [
    mockTrack({ id: 'track-a', title: mockLocalised('Track A') }),
    mockTrack({ id: 'track-b', title: mockLocalised('Track B') }),
    mockTrack({ id: 'track-c', title: mockLocalised('Track C') }),
  ]

  const speakers: Speaker[] = [
    mockSpeaker({
      id: 'speaker-a',
      name: 'Speaker A',
      role: mockLocalised('Role A'),
    }),
    mockSpeaker({
      id: 'speaker-b',
      name: 'Speaker B',
      role: mockLocalised('Role B'),
    }),
    mockSpeaker({
      id: 'speaker-c',
      name: 'Speaker C',
      role: mockLocalised('Role C'),
    }),
  ]

  const sessionBase = () => ({
    track: pickOne(tracks).id,
    themes: pickMany(themes, random(2, 4)).map((t) => t.id),
    speakers: pickMany(speakers, random(1, 3)).map((s) => s.id),
  })

  const sessions: Session[] = [
    mockSession({
      id: 'session-a',
      type: 'plenary',
      slot: 'slot-a',
      ...sessionBase(),
    }),
    mockSession({
      id: 'session-b',
      type: 'plenary',
      slot: 'slot-b',
      ...sessionBase(),
    }),
    mockSession({
      id: 'session-c',
      type: 'workshop',
      slot: 'slot-b',
      ...sessionBase(),
    }),
    mockSession({
      id: 'session-d',
      type: 'workshop',
      slot: 'slot-b',
      ...sessionBase(),
    }),
    mockSession({
      id: 'session-e',
      type: 'workshop',
      slot: 'slot-b',
      ...sessionBase(),
    }),
    mockSession({
      id: 'session-f',
      type: 'plenary',
      slot: 'slot-c',
      ...sessionBase(),
    }),
  ]

  const settings = mockSettings()

  return { slots, types, themes, tracks, speakers, sessions, settings }
}

//
// Fixtures
//

export function makeFixture<T>(base: T) {
  return (options: Partial<T> = {}): T => ({ ...base, ...options })
}

export const mockLocalised = (text: string) => ({
  en: text,
  fr: text,
  es: text,
  ar: text,
})

export const mockSession = makeFixture<Session>({
  id: 'session-a',
  type: 'plenary',
  slot: undefined,
  track: 'track-a',
  themes: ['theme-a', 'theme-b'],
  coverImage: undefined,
  title: mockLocalised('Session Title'),
  content: mockLocalised('Lorem ipsum sil dor amet ...'),
  links: [
    { type: 'video', url: 'https://youtu.be/dQw4w9WgXcQ', language: 'en' },
    { type: 'extra', url: 'https://miro.com', language: 'en' },
    { type: 'extra', url: 'https://docs.google.com/abcdef', language: 'en' },
  ],
  hostLanguages: ['en'],
  enableInterpretation: false,
  speakers: ['speaker-a', 'speaker-b', 'speaker-c'],
  hostOrganisation: mockLocalised('Host Organisation'),
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

export const mockTrack = makeFixture<Track>({
  id: 'track-a',
  title: mockLocalised('Track Title'),
})

export const mockTheme = makeFixture<Theme>({
  id: 'theme-a',
  title: mockLocalised('Theme Title'),
})

export const mockSpeaker = makeFixture<Speaker>({
  id: 'speaker-a',
  name: 'Speaker name',
  role: mockLocalised('Speaker Role'),
  bio: mockLocalised('Speaker Bio'),
  headshot: undefined,
})

export const mockSessionType = makeFixture<SessionType>({
  id: 'type-a',
  iconGroup: 'far',
  iconName: 'circle',
  layout: 'plenary',
  title: mockLocalised('Type Title'),
})

export const mockSettings = makeFixture<ConferenceConfig>({
  atrium: { enabled: true, visible: true },
  whatsOn: { enabled: true, visible: true },
  schedule: { enabled: true, visible: true },
  coffeeChat: { enabled: true, visible: true },
  helpDesk: { enabled: true, visible: true },
  startDate: new Date('2000-01-01T00:00:00.000Z'),
  endDate: new Date('3000-01-01T00:00:00.000Z'),
  isStatic: false,
})

export const mockInterpreter = makeFixture<Interpreter>({
  id: 'interpreter-a',
  name: 'Jess Smith',
  email: 'jess@example.com',
})
