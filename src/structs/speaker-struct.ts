//
// Speaker
//

import { Infer, object, string } from 'superstruct'
import { LocalisedStruct } from './localised-struct'

export type Speaker = Infer<typeof SpeakerStruct>
export const SpeakerStruct = object({
  id: string(),
  name: string(),
  role: LocalisedStruct,
  bio: LocalisedStruct,
  headshot: string(),
})
