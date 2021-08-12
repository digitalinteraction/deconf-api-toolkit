import { AuthToken, SessionState } from '@openlab/deconf-shared'
import * as ics from 'ics'

import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'

// 30 minutes
const LINKS_GRACE_MS = 30 * 60 * 1000

export function getIcsDate(date: Date) {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ] as [number, number, number, number, number]
}

type Context = Pick<
  DeconfBaseContext,
  'conferenceRepo' | 'config' | 'url' | 'attendanceRepo'
>

export class ConferenceRoutes {
  get #conferenceRepo() {
    return this.#context.conferenceRepo
  }
  get #config() {
    return this.#context.config
  }
  get #url() {
    return this.#context.url
  }
  get #attendanceRepo() {
    return this.#context.attendanceRepo
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  // GET /ics/:session_id
  async generateIcs(locale: string, sessionId: string) {
    const localise = (obj: Record<string, string>) => obj[locale]

    const session = await this.#conferenceRepo.findSession(sessionId)
    if (!session) throw ApiError.notFound()

    const slots = await this.#conferenceRepo.getSlots()
    const slot = slots.find((s) => s.id === session.slot)
    if (!slot) throw ApiError.notFound()

    const webUrl = this.#url.getSessionLink(session.id)

    const icsFile = ics.createEvent({
      start: getIcsDate(slot.start),
      startInputType: 'utc',
      end: getIcsDate(slot.end),
      endInputType: 'utc',
      title: localise(session.title),
      description: localise(session.content),
      location: webUrl.toString(),
      organizer: { ...this.#config.organiser },
    })

    if (!icsFile.value) throw ApiError.badRequest()

    return icsFile.value
  }

  // GET /sessions
  async getSchedule() {
    const states = new Set([SessionState.confirmed])

    // TODO: is this needed?
    // const attendance = await this.#attendanceRepo.getSessionAttendance()

    const rawSessions = await this.#conferenceRepo.getSessions()
    const sessions = rawSessions
      .filter((s) => states.has(s.state))
      .map((session) => ({
        ...session,
        links: [],
        // attendance: attendance.get(session.id),
      }))

    return {
      slots: await this.#conferenceRepo.getSlots(),
      settings: await this.#conferenceRepo.getSettings(),
      themes: await this.#conferenceRepo.getThemes(),
      tracks: await this.#conferenceRepo.getTracks(),
      types: await this.#conferenceRepo.getTypes(),
      speakers: await this.#conferenceRepo.getSpeakers(),
      sessions: sessions,
    }
  }

  // GET /links
  async getLinks(authToken: AuthToken | null, sessionId: string) {
    // Make sure they are authorized first
    if (!authToken) throw ApiError.unauthorized()

    const isAdmin = authToken.user_roles.includes('admin')

    // Grab the specific session
    const session = await this.#conferenceRepo.findSession(sessionId)
    if (!session) throw ApiError.notFound()

    // If not an admin and the session is capped, check the user is attending
    if (!isAdmin && session.participantCap !== null) {
      const attendance = await this.#attendanceRepo.getUserAttendance(
        authToken.sub
      )
      const isAttending = attendance.some((a) => a.session === sessionId)

      if (!isAttending) throw ApiError.unauthorized()
    }

    // Get the slot of the session
    const slots = await this.#conferenceRepo.getSlots()
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
    return session.links
  }

  async lintSessions() {
    const sessions = await this.#conferenceRepo.getSessions()
    const types = await this.#conferenceRepo.getTypes()
    const tracks = await this.#conferenceRepo.getTracks()

    const typeIds = new Set(types.map((t) => t.id))
    const trackIds = new Set(tracks.map((t) => t.id))

    const noType = sessions.filter((s) => !typeIds.has(s.type))
    const noTrack = sessions.filter((s) => !trackIds.has(s.track))
    const noLinks = sessions.filter((s) => s.links.length === 0)

    return [
      {
        title: 'Bad type',
        subtitle: 'e.g. it is not mapped to a schedule type or is unset',
        messages: noType.map(
          (s) => `Session '${s.id}' - unknown type '${s.type}'`
        ),
      },
      {
        title: 'Bad track',
        subtitle: 'e.g. it is not mapped to a schedule track or is unset',
        messages: noTrack.map(
          (s) => `Session '${s.id}' - unknown track '${s.track}'`
        ),
      },
      {
        title: 'No links',
        subtitle: 'i.e. it has no links attached to it',
        messages: noLinks.map((s) => `Session '${s.id}' - has no links`),
      },
    ]
  }
}
