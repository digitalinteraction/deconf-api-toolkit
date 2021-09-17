import {
  SessionSlot,
  Speaker,
  SessionLink,
  Theme,
} from '@openlab/deconf-shared'
import createDebug from 'debug'

// TODO: review with respect to multi-language

import got, { PaginationOptions, Got } from 'got'
import { DeconfBaseContext } from '../lib/context'
import {
  Localised,
  PretalxEvent,
  PretalxQuestion,
  PretalxResponse,
  PretalxSlot,
  PretalxSpeaker,
  PretalxTalk,
  PretalxTax,
} from './pretalx-types'

/** A paginated pretalx response */
interface PretalxPaginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

interface LocaleRecord {
  id: number
  name: string
  locale: string
}

const debug = createDebug('deconf:pretalx:service')

type Env = { PRETALX_API_TOKEN: string }
type Config = {
  eventSlug: string
  englishKeys: string[]
}
type Locales = Array<LocaleRecord>
type Context = Pick<DeconfBaseContext, 'store'> & {
  env: Env
  config: Config
  locales: Locales
}

export class PretalxService {
  get #config() {
    return this.#context.config
  }
  get #env() {
    return this.#context.env
  }

  #context: Context
  #pretalx: Got
  #codeMap = new Map<string, number>()
  #localeMap: Map<number, LocaleRecord>
  constructor(context: Context) {
    this.#context = context

    this.#pretalx = got.extend({
      prefixUrl: `https://pretalx.com/api/events/${context.config.eventSlug}`,
      headers: {
        authorization: `Token ${this.#env.PRETALX_API_TOKEN}`,
      },
      responseType: 'json',
    })

    this.#localeMap = new Map(context.locales.map((l) => [l.id, l]))
  }

  /** Create a pretalx-specific paginator for `got` requests */
  getPaginator<T>(): PaginationOptions<T, PretalxPaginated<T>> {
    return {
      pagination: {
        transform(response) {
          return response.body.results
        },
        paginate(response) {
          debug('paginate %o', response.requestUrl)
          try {
            if (!response.body.next) return false
            const next = new URL(response.body.next)

            return {
              searchParams: next.searchParams.toString(),
            }
          } catch (error) {
            return false
          }
        },
      },
    }
  }

  //
  // Data accessors
  //

  /** Fetch pretalx questions */
  getQuestions() {
    return this.#pretalx.paginate.all(
      'questions',
      this.getPaginator<PretalxQuestion>()
    )
  }

  /** Fetch the pretalx event */
  getEvent() {
    return this.#pretalx.get('').json<PretalxEvent>()
  }

  /** Fetch all pretalx submissions */
  getSubmissions() {
    return this.#pretalx.paginate.all(
      'submissions',
      this.getPaginator<PretalxTalk>()
    )
  }

  /** Fetch released pretalx submissions */
  getTalks() {
    return this.#pretalx.paginate.all('talks', this.getPaginator<PretalxTalk>())
  }

  /** Fetch pretalx speakers */
  getSpeakers() {
    return this.#pretalx.paginate.all(
      'speakers',
      this.getPaginator<PretalxSpeaker>()
    )
  }

  /** Fetch pretalx tags */
  getTags() {
    return this.#pretalx.paginate.all('tags', this.getPaginator<PretalxTax>())
  }

  //
  // Answer helpers
  //

  /** Find the answer to a question from a set of responses */
  findAnswer(questionId: number, responses: PretalxResponse[]) {
    for (const r of responses) {
      if (r.question.id === questionId) {
        debug('findAnswer question=%o answer=%o', questionId, r.answer)
        return r.answer
      }
    }
    return null
  }

  /** Create a unique id for a slot based on it's date */
  getSlotId(slot: PretalxSlot) {
    // TODO: could simplify date -> "yyyy-mm-ddThh:mm"
    return `${slot.start}__${slot.end}`
  }

  /** Decide wether a string is a URL or not */
  isUrl(input: string) {
    try {
      new URL(input)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Take a string and ensure it is unique within the life of this PretalxService instance.
   * Achieved by appending a number to the end
   */
  makeUnique(code: string) {
    const count = this.#codeMap.get(code) ?? 1
    const id = `${code}-${count}`
    this.#codeMap.set(code, count + 1)
    return id
  }

  /** From a localised title, generate a slug-based id */
  getIdFromTitle(localised: Localised | null, fallback: string) {
    return localised
      ? this.getSlug(
          this.#config.englishKeys.find((k) => localised[k]) ?? fallback
        )
      : fallback
  }

  /** Convert a name with spaces and punctuation into a slug with '-'s */
  getSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/[^\w-]+/g, '')
  }

  //
  // Conversions
  //

  /** Generate deconf slots based on pretalx talks */
  getDeconfSlots(talks: PretalxTalk[]): SessionSlot[] {
    const slotMap = new Map<string, SessionSlot>()
    for (const talk of talks) {
      if (!talk.slot) continue

      const id = this.getSlotId(talk.slot)
      if (slotMap.has(id)) continue

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

  /** Generate deconf speakers based on pretalx speakers */
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
      bio: { en: speaker.bio ?? '' },
      headshot: speaker.avatar ?? '',
    }))
  }

  /** Generate deconf themes based on pretalx tags */
  getDeconfThemes(tags: PretalxTax[]): Theme[] {
    return tags.map((tag) => ({
      id: tag.tag,
      title: tag.description,
    }))
  }

  /** Parse out links from a set of pretalx questions */
  getSessionLinks(talk: PretalxTalk, linksQuestions: number[]): SessionLink[] {
    const text = linksQuestions
      .map((questionId) => this.findAnswer(questionId, talk.answers))
      .filter((answer) => Boolean(answer))
      .join('\n')

    const result: SessionLink[] = text
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
   * Get a session's host languages based on a custom question
   * TODO: rethink this
   */
  getSessionLocales(talk: PretalxTalk, localeQuestion: number) {
    const localeAnswer = talk.answers.find(
      (a) => a.question.id === localeQuestion
    )

    const locales = new Set<string>()
    if (localeAnswer) {
      for (const option of localeAnswer.options) {
        const locale = this.#localeMap.get(option.id)?.locale
        locales.add(locale ?? 'en')
      }
    }
    if (locales.size === 0) locales.add('en')

    return Array.from(locales)
  }

  /** Get a session's capacity answer */
  getSessionCap(talk: PretalxTalk, capacityQuestionId: number) {
    const capAnswer = this.findAnswer(capacityQuestionId, talk.answers)
    if (!capAnswer) return null

    const participantCap = parseInt(capAnswer, 10)
    if (Number.isNaN(participantCap) || participantCap <= 0) return null

    return participantCap
  }
}
