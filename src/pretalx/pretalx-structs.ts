import { array, number, object, string } from 'superstruct'

export const PretalxConfigStruct = object({
  eventSlug: string(),
  localeKeys: array(string()),
  questions: object({
    pulsePhoto: number(),
    links: array(number()),
    affiliation: number(),
    locale: number(),
    capacity: number(),
  }),
})
