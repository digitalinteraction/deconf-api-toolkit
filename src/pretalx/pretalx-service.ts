import {
  SessionSlot,
  Speaker,
  LocalisedLink,
  Theme,
} from '@openlab/deconf-shared'

import got, { PaginationOptions, Got } from 'got'
import { DeconfBaseContext } from '../lib/context.js'
import { createDebug } from '../lib/module.js'
import {
  Localised,
  PretalxEvent,
  PretalxQuestion,
  PretalxResponse,
  PretalxSlot,
  PretalxSpeaker,
  PretalxTalk,
  PretalxTax,
} from './pretalx-types.js'

/** A paginated pretalx response */
interface PretalxPaginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// interface LocaleRecord {
//   id: number
//   name: string
//   locale: string
// }

const debug = createDebug('deconf:pretalx:service')

export interface GetSubmissionOptions {
  questions?: number[]
}

export interface GetSpeakersOptions {
  questions?: number[]
}

type Context = Pick<DeconfBaseContext, 'store'> & {
  env: {
    PRETALX_API_TOKEN: string
  }
  config: {
    eventSlug: string
    englishKeys: string[]
    pageSize?: number
  }
}

/**
 * `PretalxService` provides access to the Pretalx API
 * and provides methods to convert pretalx resources into deconf ones.
 *
 * ```ts
 * const store: KeyValueStore
 * const env = { PRETALX_API_TOKEN: string }
 * const config = {
 *   eventSlug: string,
 *   englishKeys: string[],
 * }
 *
 * const pretalx = new PretalxService({ store, env, config })
 * ```
 */
export class PretalxService {
  #context: Context
  #pretalx: Got
  #codeMap = new Map<string, number>()
  constructor(context: Context) {
    this.#context = context

    this.#pretalx = got.extend({
      prefixUrl: `https://pretalx.com/api/events/${context.config.eventSlug}`,
      headers: {
        authorization: `Token ${this.#context.env.PRETALX_API_TOKEN}`,
      },
      responseType: 'json',
    })
  }

  /** @internal Create a pretalx-specific paginator for `got` requests */
  getPaginator<T>(): PaginationOptions<T, PretalxPaginated<T>> {
    return {
      transform(response) {
        return response.body.results
      },
      paginate(data) {
        debug('paginate %o', data.response.requestUrl.toString())
        try {
          if (!data.response.body.next) return false
          const next = new URL(data.response.body.next)

          return {
            searchParams: next.searchParams,
          }
        } catch (error) {
          return false
        }
      },
    }
  }

  /** @internal Get common URL search params */
  get baseSearchParams() {
    const { pageSize = 100 } = this.#context.config
    return { limit: pageSize.toString() }
  }

  //
  // Data accessors
  //

  /** Fetch pretalx questions */
  getQuestions() {
    return this.#pretalx.paginate.all('questions', {
      pagination: this.getPaginator<PretalxQuestion>(),
      searchParams: this.baseSearchParams,
    })
  }

  /** Fetch the pretalx event */
  getEvent() {
    return this.#pretalx.get('').json<PretalxEvent>()
  }

  /** Fetch all pretalx submissions */
  getSubmissions(options: GetSubmissionOptions = {}) {
    const searchParams = new URLSearchParams(this.baseSearchParams)
    searchParams.set('questions', options.questions?.join(',') ?? 'all')

    return this.#pretalx.paginate.all('submissions', {
      pagination: this.getPaginator<PretalxTalk>(),
      searchParams,
    })
  }

  /** Fetch released pretalx submissions @deprecated */
  getTalks() {
    return this.#pretalx.paginate.all('talks', {
      pagination: this.getPaginator<PretalxTalk>(),
      searchParams: this.baseSearchParams,
    })
  }

  /** Fetch pretalx speakers */
  getSpeakers(options: GetSpeakersOptions = {}) {
    const searchParams = new URLSearchParams(this.baseSearchParams)
    searchParams.set('questions', options.questions?.join(',') ?? 'all')

    return this.#pretalx.paginate.all('speakers', {
      pagination: this.getPaginator<PretalxSpeaker>(),
      searchParams,
    })
  }

  /** Fetch pretalx tags */
  getTags() {
    return this.#pretalx.paginate.all('tags', {
      pagination: this.getPaginator<PretalxTax>(),
      searchParams: this.baseSearchParams,
    })
  }

  //
  // Answer helpers
  //

  /** `findAnswer` gets the answer to a specific question from an array of responses. */
  findAnswer(questionId: number, responses: PretalxResponse[]) {
    for (const r of responses) {
      if (r.question.id === questionId) {
        debug('findAnswer question=%o answer=%o', questionId, r.answer)
        return r.answer
      }
    }
    return null
  }

  /**
   * `getSlotId` generates a unique id for a pretalx slot,
   * it uses undefined to match `Session#slot`'s type
   */
  getSlotId(slot?: PretalxSlot) {
    if (!slot || !slot.start || !slot.end) return undefined
    const start = new Date(slot.start)
    const end = new Date(slot.end)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return undefined
    }

    return `${start.getTime()}__${end.getTime()}`
  }

  /** `isUrl` determines if a string passed is a URL or not */
  isUrl(input: string) {
    try {
      const url = new URL(input)
      return Boolean(url.hostname && url.pathname)
    } catch (error) {
      return false
    }
  }

  /**
   * `makeUnique` takes a possibly duplicated id and makes sure it is unique
   * (within the life of the PretalxService itself)
   */
  makeUnique(code: string) {
    const count = this.#codeMap.get(code) ?? 1
    const id = `${code}-${count}`
    this.#codeMap.set(code, count + 1)
    return id
  }

  /** `getIdFromTitle` converts a localised text title into a slug */
  getIdFromTitle(localised: Localised | null, fallback: string) {
    if (!localised) return fallback
    for (const key of this.#context.config.englishKeys) {
      if (localised[key]) return this.getSlug(localised[key] as string)
    }
    return fallback
  }

  /** `getSlug` converts a text string into a URL friendly slug */
  getSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/-+/g, '-')
  }

  //
  // Conversions
  //

  /** `getDeconfSlots` finds the unique slots from a set of pretalx talks */
  getDeconfSlots(talks: PretalxTalk[]): SessionSlot[] {
    const slotMap = new Map<string, SessionSlot>()
    for (const talk of talks) {
      if (!talk.slot) continue

      const id = this.getSlotId(talk.slot)
      if (!id || slotMap.has(id)) continue

      slotMap.set(id, {
        id: id,
        start: new Date(talk.slot.start),
        end: new Date(talk.slot.end),
      })
    }
    const deconfSlots = Array.from(slotMap.values())
    deconfSlots.sort((a, b) =>
      a.start.toISOString().localeCompare(b.start.toISOString())
    )
    return deconfSlots
  }

  /** `getDeconfSpeakers` converts pretalx speakers to deconf */
  getDeconfSpeakers(
    speakers: PretalxSpeaker[],
    affiliationQuestion: number
  ): Speaker[] {
    return speakers.map((speaker) => ({
      id: speaker.code,
      name: speaker.name,
      role: {
        en: this.findAnswer(affiliationQuestion, speaker.answers) ?? '',
      },
      bio: { en: speaker.biography ?? '' },
      headshot: speaker.avatar ?? '',
    }))
  }

  /** `getDeconfThemes` converts pretalx tags to themes */
  getDeconfThemes(tags: PretalxTax[]): Theme[] {
    return tags.map((tag) => ({
      id: tag.tag,
      title: tag.description,
    }))
  }

  /**
   * `getSessionLinks` generates a set of `LocalisedLinks` for a session
   * based on the answers to multiple questions
   */
  getSessionLinks(
    talk: PretalxTalk,
    linksQuestions: number[]
  ): LocalisedLink[] {
    const text = linksQuestions
      .map((questionId) => this.findAnswer(questionId, talk.answers))
      .filter((answer) => Boolean(answer))
      .join('\n')

    const result: LocalisedLink[] = text
      .split(/\s+/)
      .filter((text) => this.isUrl(text))
      .map((link) => ({
        type: 'any',
        language: 'en',
        url: link,
      }))

    debug(
      'pullLinks %o %o',
      text,
      result.map((l) => l.url)
    )
    return result
  }

  /**
   * `getSessionCap` finds the answer to a numeric question
   * and attempts to parse the number as an integer.
   * It returns the number if it is found, or null if not found or not a numeric string.
   */
  getSessionCap(talk: PretalxTalk, capacityQuestionId: number) {
    const capAnswer = this.findAnswer(capacityQuestionId, talk.answers)
    if (!capAnswer) return null

    const participantCap = parseInt(capAnswer, 10)
    if (Number.isNaN(participantCap) || participantCap <= 0) return null

    return participantCap
  }
}
