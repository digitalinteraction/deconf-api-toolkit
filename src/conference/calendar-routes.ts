import {
  AuthToken,
  PrivateCalendar,
  Session,
  SessionSlot,
} from '@openlab/deconf-shared'
import { createEvent, createEvents, EventAttributes } from 'ics'
import {
  ApiError,
  DeconfBaseContext,
  localise,
  UserICalToken,
} from '../lib/module'

/**
 * `getIcsDate` formats a `Date` for the `ics` library,
 * i.e. `[year, month, date, hour, minutes]` as UTC values.
 *
 * ```ts
 * const icsFormat = getIcsDate(new Date())
 * // returns [2022, 08, 01, 12, 59]
 * ```
 */
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

/**
 * `getGoogleDate` formats a `Date` for the `calendar.google.com`,
 * i.e. `yyyymmddThhmmssZ` as UTC values.
 *
 * ```ts
 * const googleFormat = getGoogleDate(new Date())
 * ```
 */
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

/**
 * generates `ics` parameters for a `Session` + `Slot`
 * @internal
 */
export function getSessionIcsAttributes(
  locale: string,
  session: Session,
  slot: SessionSlot,
  url: URL,
  options: CalendarOptions = {}
): EventAttributes {
  return {
    start: getIcsDate(slot.start),
    startInputType: 'utc',
    end: getIcsDate(slot.end),
    endInputType: 'utc',
    title: localise(locale, session.title, 'Session'),
    description: localise(locale, session.content, ''),
    location: url.toString(),
    calName: options.calName,
  }
}

/** Options for generating an ics calendar */
export interface CalendarOptions {
  calName?: string
}

type Context = Pick<
  DeconfBaseContext,
  'conferenceRepo' | 'url' | 'attendanceRepo' | 'jwt'
>

/**
 * `CalendarRoutes` provides routes for processing conference data into calendar events.
 *
 * ```ts
 * const conferenceRepo: ConferenceRepository
 * const url: UrlService
 * const attendanceRepo: AttendanceRepository
 *
 * const app = express().use(express.json())
 *
 * const calendarRoutes = new CalendarRoutes({
 *   conferenceRepo,
 *   url,
 *   attendanceRepo,
 * })
 * ```
 *
 * @todo Update to use express-based examples
 */
export class CalendarRoutes {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  /**
   * `getSessionIcsFile` returns a translated ics file from a `Session`.
   * It returns a string which is the contents of the ics file.
   *
   * ```ts
   * const file = await calendarRoutes.getSessionIcsFile('en', 'session-a')
   * ```
   *
   * Set these headers for it to download nicely:
   *
   * - `Content-Type: text/calendar`
   * - `Content-Disposition: attachment; filename="{session_id}.ics`
   *   — where `session_id` is the id of the session being downloaded
   *
   * Potential errors:
   *
   * - `general.notFound` — if the session is not found or is not scheduled
   * - `general.internalServerError` — if there was an unknown error generating the ics.
   */
  async getSessionIcsFile(
    locale: string,
    sessionId: string,
    options: CalendarOptions = {}
  ): Promise<string> {
    const session = await this.#context.conferenceRepo.findSession(sessionId)
    if (!session) throw ApiError.notFound()

    const slots = await this.#context.conferenceRepo.getSlots()
    const slot = slots.find((s) => s.id === session.slot)
    if (!slot) throw ApiError.notFound()

    const icsFile = createEvent(
      getSessionIcsAttributes(
        locale,
        session,
        slot,
        this.#context.url.getSessionLink(session.id),
        options
      )
    )

    if (!icsFile.value) {
      console.error('Failed to generate ical for session=%o', sessionId)
      console.error(icsFile.error)
      throw ApiError.internalServerError()
    }

    return icsFile.value
  }

  /**
   * `getGoogleCalendarUrl` generates a URL to add a `Session` to a visitor's Google Calendar.
   * Redirect the visitor to the returned URL so they can add the session to their calendar.
   *
   * ```ts
   * const url = await calendarRoutes.getGoogleCalendarUrl('en', 'session-a')
   * ```
   *
   * Potential errors:
   *
   * - `general.notFound` — if the session is not found or is not scheduled
   */
  async getGoogleCalendarUrl(locale: string, sessionId: string): Promise<URL> {
    const session = await this.#context.conferenceRepo.findSession(sessionId)
    if (!session) throw ApiError.notFound()

    const slots = await this.#context.conferenceRepo.getSlots()
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
      this.#context.url.getSessionLink(session.id).toString()
    )

    return url
  }

  /**
   * `getUserIcs` generates an ICS file with all sessions a visitor is attending.
   * see `getSessionIcsFile` for the best headers to set.
   *
   * ```ts
   * const file = await calendarRoutes.getSessionIcsFile(icalToken)
   * ```
   *
   * Potential errors:
   *
   * - `general.unauthorized` — if `icalToken` is not passed, it should be validated elsewhere.
   * - `general.internalServerError` — if there was an unknown error generating the ics.
   */
  async getUserIcs(icalToken?: UserICalToken, options: CalendarOptions = {}) {
    if (!icalToken) throw ApiError.unauthorized()

    // Grab slots and index them by key
    const slots = await this.#context.conferenceRepo.getSlots()
    const slotMap = new Map(slots.map((s) => [s.id, s]))

    // Grab sessions and index them by key
    const sessions = await this.#context.conferenceRepo.getSessions()
    const sessionMap = new Map(sessions.map((s) => [s.id, s]))

    // Get the sessions the user is attending
    const attending = await this.#context.attendanceRepo.getUserAttendance(
      icalToken.sub
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
        getSessionIcsAttributes(
          icalToken.user_lang,
          session,
          slot,
          this.#context.url.getSessionLink(session.id),
          options
        )
      )

    // Generate an ical file and return it
    const ical = createEvents(userSessions)
    if (!ical.value) {
      console.error('Failed to generate ical for user=%o', icalToken.sub)
      console.error(ical.error)
      throw ApiError.internalServerError()
    }
    return ical.value
  }

  /**
   * `createUserCalendar` generates a URL for a user's personal calendar,
   * the endpoint should be served by [[getUserIcs]].
   *
   * ```ts
   * const url = calendarRoutes.createUserCalendar()
   * ```
   */
  createUserCalendar(
    authToken: AuthToken | undefined,
    getCalendarUrl: (token: string) => URL
  ): PrivateCalendar {
    if (!authToken) throw ApiError.unauthorized()

    const icalToken = this.#context.jwt.signToken<UserICalToken>({
      kind: 'user-ical',
      sub: authToken.sub,
      user_lang: authToken.user_lang,
    })

    return { url: getCalendarUrl(icalToken) }
  }
}
