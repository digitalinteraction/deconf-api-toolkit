import { array, object, string } from 'superstruct'

/** `PretalxConfigStruct` validates the configuration for a `PretalxService` */
export const PretalxConfigStruct = object({
  eventSlug: string(),
  englishKeys: array(string()),
})
