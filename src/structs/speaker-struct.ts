//
// Speaker
//

import { Describe, object, optional, string } from 'superstruct'
import { LocalisedStruct } from './localised-struct'
import { Speaker } from '@openlab/deconf-shared'

export const SpeakerStruct: Describe<Speaker> = object({
  id: string(),
  name: string(),
  role: LocalisedStruct,
  bio: LocalisedStruct,
  headshot: optional(string()),
})
