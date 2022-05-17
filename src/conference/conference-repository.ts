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

/**
 * `ConferenceRepository` is responsible for retrieving conference information from a `KeyValueStore`.
 *
 * ```ts
 * const store: KeyValueStore
 *
 * const conferenceRepo = new ConferenceRepository({ store })
 * ```
 */
export class ConferenceRepository {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async #get<T extends unknown>(key: string, fallback: T) {
    return (await this.#context.store.retrieve<T>(key)) ?? fallback
  }

  /**
   * `getSlots` returns the slots for a conference, which are the timespans available
   * for sessions to occur in. They group sessions together in the schedule.
   *
   * `ConferenceRepository` assumes the `store` serialises values as JSON and `getSlots`
   * makes sure to unserialise the `start` and `end` date of each slot.
   *
   * ```ts
   * const slots = conferenceRepo.getSlots()
   * ```
   */
  async getSlots(): Promise<SessionSlot[]> {
    const slots = await this.#get<SessionSlotJson[]>('schedule.slots', [])
    if (!slots) return []

    return slots.map((s) => ({
      id: s.id,
      start: new Date(s.start),
      end: new Date(s.end),
    }))
  }

  /**
   * `getSessions` fetches the conference's `Session` records.
   *
   * ```ts
   * const sessions = await conferenceRepo.getSessions()`
   * ```
   */
  getSessions() {
    return this.#get<Session[]>('schedule.sessions', [])
  }

  /**
   * `findSession` finds a specific record with an id, or returns `null`.
   *
   * ```ts
   * const session = await conferenceRepo.findSession('session-a')`
   * ```
   */
  async findSession(id: string) {
    const sessions = await this.getSessions()
    return sessions.find((s) => s.id === id) ?? null
  }

  /**
   * `getTracks` fetches the conference's `Track` objects.
   *
   * ```ts
   * const tracks = await conferenceRepo.getTracks()`
   * ```
   */
  getTracks() {
    return this.#get<Track[]>('schedule.tracks', [])
  }

  /**
   * `getThemes` fetches the conference's `Theme` objects.
   *
   * ```ts
   * const themes = await conferenceRepo.getThemes()`
   * ```
   */
  getThemes() {
    return this.#get<Theme[]>('schedule.themes', [])
  }

  /**
   * `getSpeakers` fetches the conference's `Speaker` objects.
   *
   * ```ts
   * const speakers = await conferenceRepo.getSpeakers()`
   * ```
   */
  getSpeakers() {
    return this.#get<Speaker[]>('schedule.speakers', [])
  }

  /**
   * `getTypes` fetches the conference's `SessionType` objects.
   *
   * ```ts
   * const sessionTypes = await conferenceRepo.getTypes()`
   * ```
   */
  getTypes() {
    return this.#get<SessionType[]>('schedule.types', [])
  }

  /**
   * `getSettings` fetches the conference's `ConferenceConfig` object
   * or `null` if it is not set.
   *
   * ```ts
   * const settings = await conferenceRepo.getSettings()`
   * ```
   */
  getSettings() {
    return this.#get<ConferenceConfig | null>('schedule.settings', null)
  }

  /**
   * `getInterpreters` fetches the conference's `Interpreter` objects.
   * These are used to assign `user_roles` when authenticating.
   *
   * ```ts
   * const interpreters = await conferenceRepo.getInterpreters()`
   * ```
   */
  getInterpreters(): Promise<Interpreter[]> {
    return this.#get<Interpreter[]>('schedule.interpreters', [])
  }

  /**
   * `findInterpreter` finds a specific interpreter with an email, or returns `null`.
   *
   * ```ts
   * const interpreter = await conferenceRepo.findInterpreter('jess@example.com')`
   * ```
   */
  async findInterpreter(email: string) {
    const interpreters = await this.getInterpreters()
    return (
      interpreters.find((i) => i.email.toLowerCase() === email.toLowerCase()) ??
      null
    )
  }
}
