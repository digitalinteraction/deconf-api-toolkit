import {
  SessionSlot,
  Speaker,
  Track,
  SessionLink,
  Session,
  SessionVisibility,
  ConfigSettings,
  SessionState,
  SessionType,
  Theme,
  Interpreter,
} from '@openlab/deconf-shared'
import createDebug from 'debug'

// TODO: review with respect to multi-language

import got, { PaginationOptions, Got } from 'got'
import { Infer } from 'superstruct'
import { DeconfBaseContext } from '../lib/context'
import { PretalxConfigStruct } from './pretalx-structs'
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
type Config = Infer<typeof PretalxConfigStruct>
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
              // searchParams: next.searchParams,
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
  getQuestions() {
    return this.#pretalx.paginate.all(
      'questions',
      this.getPaginator<PretalxQuestion>()
    )
  }
  getEvent() {
    return this.#pretalx.get('').json<PretalxEvent>()
  }
  getTalks() {
    return this.#pretalx.paginate.all('talks', this.getPaginator<PretalxTalk>())
  }
  getSpeakers() {
    return this.#pretalx.paginate.all(
      'speakers',
      this.getPaginator<PretalxSpeaker>()
    )
  }
  getTags() {
    return this.#pretalx.paginate.all('tags', this.getPaginator<PretalxTax>())
  }

  //
  // Schedule generator
  //
  async generateSchedule() {
    // Fetch data
    const pretalx = {
      event: await this.getEvent(),
      questions: await this.getQuestions(),
      talks: await this.getTalks(),
      speakers: await this.getSpeakers(),
      tags: await this.getTags(),
    }

    // Convert to deconf
    const slots = this.getDeconfSlots(pretalx.talks)
    const speakers = this.getDeconfSpeakers(pretalx.speakers)
    const themes = this.getDeconfThemes(pretalx.tags)
    const sessions = this.getSessions(pretalx.talks)
    const settings: ConfigSettings = {
      atrium: { enabled: true, visible: true },
      whatsOn: { enabled: false, visible: false },
      schedule: { enabled: true, visible: true },
      coffeeChat: { enabled: false, visible: false },
      helpDesk: { enabled: false, visible: false },

      startDate: new Date(pretalx.event.date_from),
      endDate: new Date(pretalx.event.date_to),
      isStatic: false,
    }

    const tracks: Track[] = [] // TODO
    const types: SessionType[] = [] // TODO
    const interpreters: Interpreter[] = [] // TODO

    // Return schedule
    return {
      slots,
      speakers,
      tracks,
      types,
      themes,
      sessions,
      interpreters,
      settings,
    }
  }

  //
  // Misc
  //
  findAnswer(questionId: number, responses: PretalxResponse[]) {
    for (const r of responses) {
      if (r.question.id === questionId) {
        debug('findAnswer question=%o answer=%o', questionId, r.answer)
        return r.answer
      }
    }
    return null
  }
  getSlotId(slot: PretalxSlot) {
    return `${slot.start}__${slot.end}`
  }
  isUrl(input: string) {
    try {
      new URL(input)
      return true
    } catch (error) {
      return false
    }
  }
  makeUnique(code: string) {
    const count = this.#codeMap.get(code) ?? 1
    const id = `${code}-${count}`
    this.#codeMap.set(code, count + 1)
    return id
  }
  delocalise<T>(l: Localised | null, fallback: T) {
    if (!l) return fallback
    for (const key of this.#config.localeKeys) {
      const value = l[key]
      if (value) return value
    }
    return fallback
  }
  getSlug(name: string) {
    // Convert a name with spaces and punctuation into a slug with '-'s
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
  getDeconfSlots(talks: PretalxTalk[]) {
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
  getDeconfSpeakers(speakers: PretalxSpeaker[]) {
    const affiliationQuestion = this.#config.questions.affiliation
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
  getDeconfThemes(tags: PretalxTax[]) {
    return tags.map((tag) => ({
      id: tag.tag,
      title: {
        en: this.delocalise(tag.description, tag.tag),
      },
    }))
  }
  getSessionLinks(talk: PretalxTalk) {
    const text = this.#config.questions.links
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
  getSessionLocales(talk: PretalxTalk) {
    const localeQuestionId = this.#config.questions.locale
    const localeAnswer = talk.answers.find(
      (a) => a.question.id === localeQuestionId
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
  getSessionCap(talk: PretalxTalk) {
    const capacityQuestionId = this.#config.questions.capacity

    const capAnswer = this.findAnswer(capacityQuestionId, talk.answers)
    if (!capAnswer) return null

    const participantCap = parseInt(capAnswer, 10)
    if (Number.isNaN(participantCap) || participantCap <= 0) return null

    return participantCap
  }
  getSessions(talks: PretalxTalk[]) {
    return talks.map((talk) => {
      const slot = talk.slot ? this.getSlotId(talk.slot) : undefined
      const type = this.getSlug(
        this.delocalise(talk.submission_type, 'unknown')
      )
      const track = this.getSlug(this.delocalise(talk.track, 'unknown'))

      if (type === 'unknown') {
        console.error('Talk %o does not have a type', talk.code)
      }

      if (track === 'unknown') {
        console.error('Talk %o does not have a track', talk.code)
      }

      return {
        id: this.makeUnique(talk.code),
        type: type,
        title: { en: talk.title },
        track: track,
        themes: talk.tags ?? [],
        coverImage: '',
        content: { en: talk.description },
        links: this.getSessionLinks(talk),
        hostLanguages: this.getSessionLocales(talk),
        enableInterpretation: false,
        speakers: talk.speakers.map((s) => s.code),
        hostOrganisation: { en: '' }, // todo
        isRecorded: talk.do_not_record !== true,
        isOfficial: false,
        isFeatured: talk.is_featured,
        visibility: SessionVisibility.private,
        state: talk.state as SessionState,
        slot: slot,
        participantCap: this.getSessionCap(talk),

        proxyUrl: undefined,
        hideFromSchedule: false,
      }
    })
  }
}
