import { array, number, object, string } from 'superstruct'

export const PretalxConfigStruct = object({
  eventSlug: string(),
  localeKeys: array(string()),
  questions: object({
    links: array(number()),
    affiliation: number(),
    locale: number(),
    capacity: number(),
  }),
})
