import {
  ConferenceConfig,
  Interpreter,
  Session,
  SessionSlot,
  SessionSlotJson,
  SessionType,
  Speaker,
  Theme,
  Track,
} from '@openlab/deconf-shared'
import { DeconfBaseContext } from '../lib/context'

type Context = Pick<DeconfBaseContext, 'store'>

export class ConferenceRepository {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async #get<T extends unknown>(key: string, fallback: T) {
    return (await this.#context.store.retrieve<T>(key)) ?? fallback
  }

  async getSlots(): Promise<SessionSlot[]> {
    const slots = await this.#get<SessionSlotJson[]>('schedule.slots', [])
    if (!slots) return []

    return slots.map((s) => ({
      id: s.id,
      start: new Date(s.start),
      end: new Date(s.end),
    }))
  }

  getSessions() {
    return this.#get<Session[]>('schedule.sessions', [])
  }

  async findSession(id: string) {
    const sessions = await this.getSessions()
    return sessions.find((s) => s.id === id) ?? null
  }

  getTracks() {
    return this.#get<Track[]>('schedule.tracks', [])
  }

  getThemes() {
    return this.#get<Theme[]>('schedule.themes', [])
  }

  getSpeakers() {
    return this.#get<Speaker[]>('schedule.speakers', [])
  }

  getTypes() {
    return this.#get<SessionType[]>('schedule.types', [])
  }

  getSettings() {
    return this.#get<ConferenceConfig | null>('schedule.settings', null)
  }

  getInterpreters(): Promise<Interpreter[]> {
    return this.#get<Interpreter[]>('schedule.interpreters', [])
  }

  async findInterpreter(email: string) {
    const interpreters = await this.getInterpreters()
    return (
      interpreters.find((i) => i.email.toLowerCase() === email.toLowerCase()) ??
      null
    )
  }
}
