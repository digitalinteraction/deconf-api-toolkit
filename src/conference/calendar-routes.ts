import { AuthToken, Session, SessionSlot } from '@openlab/deconf-shared'
import { createEvent, createEvents, EventAttributes } from 'ics'
import { ApiError, DeconfBaseContext, localise } from '../lib/module'

type Context = Pick<
  DeconfBaseContext,
  'conferenceRepo' | 'url' | 'attendanceRepo'
>

/** Convert a `Date` into an ICS format */
export function getIcsDate(date: Date) {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ] as [number, number, number, number, number]
}

const padStart = (input: number, zeros: number) => {
  return input.toString().padStart(zeros, '0')
}

/** Convert a `Date` into an Google Calendar format */
export function getGoogleDate(input: Date) {
  return [
    input.getUTCFullYear(),
    padStart(input.getUTCMonth() + 1, 2),
    padStart(input.getUTCDate(), 2),
    'T',
    padStart(input.getUTCHours(), 2),
    padStart(input.getUTCMinutes(), 2),
    padStart(input.getUTCSeconds(), 2),
    'Z',
  ].join('')
}

export function getSessionIcs(
  locale: string,
  session: Session,
  slot: SessionSlot,
  url: URL
): EventAttributes {
  return {
    start: getIcsDate(slot.start),
    startInputType: 'utc',
    end: getIcsDate(slot.end),
    endInputType: 'utc',
    title: localise(locale, session.title, 'Session'),
    description: localise(locale, session.content, ''),
    location: url.toString(),
  }
}

export class CalendarRoutes {
  get #conferenceRepo() {
    return this.#context.conferenceRepo
  }
  get #url() {
    return this.#context.url
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  /** Generate an ics file for a Session */
  async getSessionIcsFile(locale: string, sessionId: string): Promise<string> {
    const session = await this.#conferenceRepo.findSession(sessionId)
    if (!session) throw ApiError.notFound()

    const slots = await this.#conferenceRepo.getSlots()
    const slot = slots.find((s) => s.id === session.slot)
    if (!slot) throw ApiError.notFound()

    const icsFile = createEvent(
      getSessionIcs(locale, session, slot, this.#url.getSessionLink(session.id))
    )

    if (!icsFile.value) throw ApiError.internalServerError()

    return icsFile.value
  }

  /** Get a calendar.google.com URL to add a Session as an event */
  async getGoogleCalendarUrl(locale: string, sessionId: string): Promise<URL> {
    const session = await this.#conferenceRepo.findSession(sessionId)
    if (!session) throw ApiError.notFound()

    const slots = await this.#conferenceRepo.getSlots()
    const slot = slots.find((s) => s.id === session.slot)
    if (!slot) throw ApiError.notFound()

    const url = new URL('https://calendar.google.com/event')
    url.searchParams.set('action', 'TEMPLATE')
    url.searchParams.set(
      'dates',
      `${getGoogleDate(slot.start)}/${getGoogleDate(slot.end)}`
    )
    url.searchParams.set('text', localise(locale, session.title, ''))
    url.searchParams.set(
      'location',
      this.#url.getSessionLink(session.id).toString()
    )

    return url
  }

  /** Generate an ical file for a user, filled with the sessions they are attending */
  async getUserIcs(authToken?: AuthToken) {
    if (!authToken) throw ApiError.unauthorized()

    // Grab slots and index them by key
    const slots = await this.#conferenceRepo.getSlots()
    const slotMap = new Map(slots.map((s) => [s.id, s]))

    // Grab sessions and index them by key
    const sessions = await this.#conferenceRepo.getSessions()
    const sessionMap = new Map(sessions.map((s) => [s.id, s]))

    // Get the sessions the user is attending
    const attending = await this.#context.attendanceRepo.getUserAttendance(
      authToken.sub
    )

    // Convert the user's sessions into ics parameters to create ical events
    const userSessions = attending
      .map((a) => {
        const session = sessionMap.get(a.session)
        const slot = session?.slot ? slotMap.get(session.slot) : undefined
        return { session: session!, slot: slot! }
      })
      .filter((s) => s.session && s.slot)
      .map(({ session, slot }) =>
        getSessionIcs(
          authToken.user_lang,
          session,
          slot,
          this.#url.getSessionLink(session.id)
        )
      )

    // Generate an ical file and return it
    const ical = createEvents(userSessions)
    if (!ical.value) {
      console.error(ical.error)
      throw ApiError.internalServerError()
    }
    return ical.value
  }
}
