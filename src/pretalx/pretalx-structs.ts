import { array, object, string } from 'superstruct'

export const PretalxConfigStruct = object({
  eventSlug: string(),
  englishKeys: array(string()),
})
