import { AuthToken, SessionState } from '@openlab/deconf-shared'
import ics from 'ics'

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
  async generateIcs(authToken: AuthToken | null, sessionId: string) {
    const locale = authToken?.user_lang ?? 'en'
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
  async getLink(sessionId: string, authToken?: AuthToken) {
    // Make sure they are authorized first
    if (!authToken) throw ApiError.notAuthorized()

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

      if (!isAttending) throw ApiError.notAuthorized()
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
      throw ApiError.notAuthorized()
    }

    // If they reached here they can have the links
    return session.links
  }
}
