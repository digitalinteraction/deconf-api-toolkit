import { array, number, object, string } from 'superstruct'

// TODO: sync up with PretalxService's Config

export const PretalxConfigStruct = object({
  eventSlug: string(),
  localeKeys: array(string()),
})
