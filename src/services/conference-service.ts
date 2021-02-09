import {
  ConfigSettings,
  Interpreter,
  Session,
  SessionSlot,
  SessionSlotJson,
  SessionType,
  Speaker,
  Theme,
  Track,
} from '@openlab/deconf-shared'

/**
 * A service for fetching information for the conference
 */
export interface ConferenceService {
  getSlots(): Promise<SessionSlot[]>
  getSessions(): Promise<Session[]>
  findSession(id: string): Promise<Session | null>
  getTracks(): Promise<Track[]>
  getThemes(): Promise<Theme[]>
  getSpeakers(): Promise<Speaker[]>
  getTypes(): Promise<SessionType[]>
  getSettings(): Promise<ConfigSettings | null>
  getInterpreters(): Promise<Interpreter[]>
  findInterpreter(email: string): Promise<Interpreter | null>
}

export function createConferenceService(
  fromCache: <T = any>(key: string, fallback: T) => Promise<T>
): ConferenceService {
  const getSessions = () => fromCache<Session[]>('schedule.sessions', [])
  const getTracks = () => fromCache<Track[]>('schedule.tracks', [])
  const getThemes = () => fromCache<Theme[]>('schedule.themes', [])
  const getSpeakers = () => fromCache<Speaker[]>('schedule.speakers', [])
  const getTypes = () => fromCache<SessionType[]>('schedule.types', [])

  const getInterpreters = () =>
    fromCache<Interpreter[]>('schedule.interpreters', [])

  const getSettings = () =>
    fromCache<ConfigSettings | null>('schedule.settings', null)

  async function getSlots(): Promise<SessionSlot[]> {
    const slots = await fromCache<SessionSlotJson[]>('schedule.slots', [])
    if (!slots) return []

    return slots.map((s) => ({
      id: s.id,
      start: new Date(s.start),
      end: new Date(s.end),
    }))
  }

  async function findSession(id: string) {
    const sessions = await getSessions()
    return sessions.find((s) => s.id === id) ?? null
  }

  async function findInterpreter(email: string) {
    const translators: Interpreter[] = await getInterpreters()
    return translators.find((t) => t.email === email) ?? null
  }

  return {
    getSlots,
    getSessions,
    findSession,
    getTracks,
    getThemes,
    getSpeakers,
    getTypes,
    getSettings,
    getInterpreters,
    findInterpreter,
  }
}
