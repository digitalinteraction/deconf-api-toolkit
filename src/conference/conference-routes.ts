import {
  AuthToken,
  ScheduleRecord,
  SessionLinks,
  SessionLintResult,
  SessionState,
} from '@openlab/deconf-shared'
import * as ics from 'ics'

import { ApiError, DeconfBaseContext } from '../lib/module'
import { getIcsDate } from './calendar-routes'

// 30 minutes
const LINKS_GRACE_MS = 30 * 60 * 1000

type Context = Pick<
  DeconfBaseContext,
  'conferenceRepo' | 'url' | 'attendanceRepo'
> & {
  /** @deprecated use `CalendarRoutes` instead */
  config: {
    organiser: DeconfBaseContext['config']['organiser']
  }
}

export class ConferenceRoutes {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  // GET /ics/:session_id
  /** @deprecated use `CalendarRoutes#getSessionIcsFile` */
  async generateIcs(locale: string, sessionId: string): Promise<string> {
    const localise = (
      obj: Record<string, string | undefined>,
      fallback: string
    ) => {
      return obj[locale] ?? obj.en ?? fallback
    }

    const session = await this.#context.conferenceRepo.findSession(sessionId)
    if (!session) throw ApiError.notFound()

    const slots = await this.#context.conferenceRepo.getSlots()
    const slot = slots.find((s) => s.id === session.slot)
    if (!slot) throw ApiError.notFound()

    const webUrl = this.#context.url.getSessionLink(session.id)

    const icsFile = ics.createEvent({
      start: getIcsDate(slot.start),
      startInputType: 'utc',
      end: getIcsDate(slot.end),
      endInputType: 'utc',
      title: localise(session.title, 'Session'),
      description: localise(session.content, ''),
      location: webUrl.toString(),
      organizer: { ...this.#context.config.organiser },
    })

    if (!icsFile.value) throw ApiError.internalServerError()

    return icsFile.value
  }

  // GET /schedule
  async getSchedule(): Promise<ScheduleRecord> {
    const states = new Set([SessionState.confirmed])

    const settings = await this.#context.conferenceRepo.getSettings()
    if (!settings) throw ApiError.internalServerError()

    const rawSessions = await this.#context.conferenceRepo.getSessions()
    const sessions = rawSessions
      .filter((s) => states.has(s.state))
      .map((session) => ({
        ...session,
        links: [],
        // attendance: attendance.get(session.id),
      }))

    return {
      slots: await this.#context.conferenceRepo.getSlots(),
      themes: await this.#context.conferenceRepo.getThemes(),
      tracks: await this.#context.conferenceRepo.getTracks(),
      types: await this.#context.conferenceRepo.getTypes(),
      speakers: await this.#context.conferenceRepo.getSpeakers(),
      settings: settings,
      sessions: sessions,
    }
  }

  // GET /links
  async getLinks(
    authToken: AuthToken | null,
    sessionId: string
  ): Promise<SessionLinks> {
    // Make sure they are authorized first
    if (!authToken) throw ApiError.unauthorized()

    const isAdmin = authToken.user_roles.includes('admin')

    // Grab the specific session
    const session = await this.#context.conferenceRepo.findSession(sessionId)
    if (!session) throw ApiError.notFound()

    // If not an admin and the session is capped, check the user is attending
    if (!isAdmin && session.participantCap !== null) {
      const attendance = await this.#context.attendanceRepo.getUserAttendance(
        authToken.sub
      )
      const isAttending = attendance.some((a) => a.session === sessionId)

      if (!isAttending) throw ApiError.unauthorized()
    }

    // Get the slot of the session
    const slots = await this.#context.conferenceRepo.getSlots()
    const slot = session.slot
      ? slots.find((s) => s.id === session.slot)
      : undefined
    if (!slot) throw ApiError.notFound()

    // If they are attending only return links when close to the session
    const timeUntil = new Date(slot.start).getTime() - Date.now()
    if (!isAdmin && timeUntil > LINKS_GRACE_MS) {
      throw ApiError.unauthorized()
    }

    // If they reached here they can have the links
    return {
      links: session.links,
    }
  }

  async lintSessions(): Promise<SessionLintResult> {
    const sessions = await this.#context.conferenceRepo.getSessions()
    const types = await this.#context.conferenceRepo.getTypes()
    const tracks = await this.#context.conferenceRepo.getTracks()

    const typeIds = new Set(types.map((t) => t.id))
    const trackIds = new Set(tracks.map((t) => t.id))

    const noType = sessions.filter((s) => !typeIds.has(s.type))
    const noTrack = sessions.filter((s) => !trackIds.has(s.track))
    const noLinks = sessions.filter((s) => s.links.length === 0)
    const unscheduled = sessions.filter(
      (s) => s.state === SessionState.confirmed && !s.slot
    )

    return [
      {
        kind: 'bad-type',
        title: 'Bad type',
        subtitle: 'e.g. it is not mapped to a schedule type or is unset',
        messages: noType.map(
          (s) => `Session '${s.id}' - unknown type '${s.type}'`
        ),
      },
      {
        kind: 'bad-track',
        title: 'Bad track',
        subtitle: 'e.g. it is not mapped to a schedule track or is unset',
        messages: noTrack.map(
          (s) => `Session '${s.id}' - unknown track '${s.track}'`
        ),
      },
      {
        kind: 'no-links',
        title: 'No links',
        subtitle: 'i.e. it has no links attached to it',
        messages: noLinks.map((s) => `Session '${s.id}' - has no links`),
      },
      {
        kind: 'no-slot',
        title: 'Not scheduled',
        subtitle: 'e.g. it is confirmed but has no start/end time set',
        messages: unscheduled.map((s) => `Session '${s.id}' is not scheduled`),
      },
    ]
  }
}
