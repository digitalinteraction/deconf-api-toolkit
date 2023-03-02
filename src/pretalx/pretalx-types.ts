/** Placeholder for types I'm not sure about yet */
type Unknown = null

/** A string thats localised into multiple languages */
export type Localised = Record<string, string | undefined>

/** https://docs.pretalx.org/api/resources/events.html */
export interface PretalxEvent {
  name: Localised
  slug: string
  is_public: true
  date_from: string // 'yyyy-mm-dd'
  date_to: string // 'yyyy-mm-dd'
  timezone: string // Europe/Amsterdam
  urls: {
    base: string
    schedule: string
    login: string
    feed: string
  }
}

/** https://docs.pretalx.org/api/resources/speakers.html */
export interface PretalxSpeaker {
  code: string
  name: string
  biography: string | null
  submissions: Unknown[]
  availabilities: Unknown[]
  avatar: string | null
  email: string | null
  answers: PretalxResponse[]
}

/** A generated slot from pretalx information */
export interface PretalxSlot {
  room: { en: string }
  start: string // 2021-03-10T04:10:00+01:00
  end: string // 2021-03-10T05:10:00+01:00
}

/** https://docs.pretalx.org/api/resources/answers.html */
export interface PretalxResponse {
  id: number
  question: {
    id: number
    question: Record<string, string>
  }
  answer: string
  answer_file: Unknown
  submission: string
  review: Unknown
  person: Unknown
  options: Array<{
    id: number
    answer: Record<string, string>
  }>
}

/** https://docs.pretalx.org/api/resources/questions.html#resource-description */
export interface PretalxQuestion {
  id: number
  variant: string
  question: Localised
  required: boolean
  target: 'submission' | 'speaker'
  options: Array<{
    id: number
    answer: Localised
  }>
  help_text: Localised
  default_answer: Unknown
}

/** https://docs.pretalx.org/api/resources/answers.html#resource-description */
export interface PretalxAnswer {}

/** https://docs.pretalx.org/api/resources/talks.html# */
export interface PretalxTalk {
  code: string
  speakers: Array<{
    code: string
    name: string
    biography: string | null
    avatar: string | null
  }>
  title: string
  submission_type: {
    'en-mozilla': string
  }
  track: {
    'en-mozilla': string
  } | null
  track_id: number | null
  submission_type_id: number | null
  state:
    | 'pending'
    | 'accepted'
    | 'confirmed'
    | 'rejected'
    | 'cancelled'
    | 'confirmed'
  abstract: Unknown
  description: string
  duration: number
  slot_count: number
  do_not_record: boolean
  is_featured: boolean
  content_locale: string // en
  slot: PretalxSlot | null
  image: Unknown
  resources: PretalxResource[]
  created: string // 2021-01-26T12:29:58.965155+01:00
  answers: PretalxResponse[]
  tags?: string[]
}

/** https://docs.pretalx.org/api/resources/tags.html */
export interface PretalxTax {
  id: number
  tag: string
  description: Localised
  color: string
}

export interface PretalxResource {
  resource: string
  description: string
}
