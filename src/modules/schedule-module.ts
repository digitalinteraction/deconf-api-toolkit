import { HttpResponse } from '../http-response'
import {
  AuthToken,
  ConferenceService,
  QueryService,
  UrlService,
} from '../services'
import ics = require('ics')
import { SessionState } from '../structs'

// TODO: improve session processing
// - don't put in links when indexing
// - seperate endpoint to pull links based on authentication

export interface ScheduleModule {
  // GET /ics/:session_id
  generateIcs(token: AuthToken | null, sessionId: string): Promise<HttpResponse>

  // GET /sessions
  getSessions(token: AuthToken | null): Promise<HttpResponse>

  // GET /settings
  getSettings(): Promise<HttpResponse>

  // GET /slots
  getSlots(): Promise<HttpResponse>

  // GET /speakers
  getSpeakers(): Promise<HttpResponse>

  // GET /themes
  getThemes(): Promise<HttpResponse>

  // GET /tracks
  getTracks(): Promise<HttpResponse>

  // GET /types
  getTypes(): Promise<HttpResponse>
}

export interface ScheduleModuleOptions {
  url: UrlService
  query: QueryService
  conference: ConferenceService
  organiser: {
    name: string
    email: string
  }
}

export function getIcsDate(date: Date) {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ] as [number, number, number, number, number]
}

export function createScheduleModule({
  conference,
  query,
  url,
  organiser,
}: ScheduleModuleOptions): ScheduleModule {
  // async function composeAttendance(
  //   attendee: Registration | null
  // ): Promise<Set<string>> {
  //   if (!attendee) return new Set()

  //   const userAttendance = await query.getUserAttendance(attendee.id)
  //   return new Set(userAttendance.map((a) => a.session))
  // }

  return {
    async generateIcs(authToken, sessionId) {
      const locale = authToken?.user_lang ?? 'en'
      const localise = (obj: Record<string, string>) => obj[locale]

      const session = await conference.findSession(sessionId)
      if (!session) return HttpResponse.notFound()

      const slots = await conference.getSlots()
      const slot = slots.find((s) => s.id === session.slot)
      if (!slot) return HttpResponse.notFound()

      const webUrl = url.getSessionLink(session.id)

      const icsFile = ics.createEvent({
        start: getIcsDate(slot.start),
        startInputType: 'utc',
        end: getIcsDate(slot.end),
        endInputType: 'utc',
        title: localise(session.title),
        description: localise(session.content),
        location: webUrl.toString(),
        organizer: { ...organiser },
      })

      if (!icsFile.value) return HttpResponse.badRequest()

      return new HttpResponse(200, icsFile.value, {
        'content-type': 'text/calendar',
        'content-disposition': `attachment; filename="${session.id}.ics"`,
      })
    },

    async getSessions(authToken) {
      let sessions = await conference.getSessions()
      sessions = sessions.filter((s) => s.state !== SessionState.draft)

      const attendance = await query.getSessionAttendance()

      // custom session logic
      for (const s of sessions) {
        // Put on the users's attendance
        ;(s as any).attendance = attendance.get(s.id) ?? 0

        // Trim data when signed out
        if (!authToken) {
          s.links = []
          // s.hostEmail = ''
        }
      }

      return new HttpResponse(200, { sessions })
    },

    async getSettings() {
      const settings = await conference.getSettings()
      if (!settings) return new HttpResponse(500, 'API not ready')
      return new HttpResponse(200, { settings })
    },

    // TODO: sort slots before they go into redis
    async getSlots() {
      // const slots = await conference.getSlots()
      // slots.sort((a, b) => a.id.localeCompare(b.id))
      return new HttpResponse(200, {
        slots: await conference.getSlots(),
      })
    },

    async getSpeakers() {
      return new HttpResponse(200, {
        speakers: await conference.getSpeakers(),
      })
    },

    async getThemes() {
      return new HttpResponse(200, {
        themes: await conference.getThemes(),
      })
    },

    async getTracks() {
      return new HttpResponse(200, {
        tracks: await conference.getTracks(),
      })
    },

    async getTypes() {
      return new HttpResponse(200, {
        types: await conference.getTypes(),
      })
    },
  }
}
