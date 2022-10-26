//
// Speaker
//

import { Describe, object, optional, string } from 'superstruct'
import { LocalisedStruct } from './localised-struct.js'
import { Speaker } from '@openlab/deconf-shared'

/** `SpeakerStruct` validates an object is a deconf `Speaker` */
export const SpeakerStruct: Describe<Speaker> = object({
  id: string(),
  name: string(),
  role: LocalisedStruct,
  bio: LocalisedStruct,
  headshot: optional(string()),
})
