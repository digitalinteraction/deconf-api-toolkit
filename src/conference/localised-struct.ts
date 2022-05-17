//
// Localised
//

import { Describe, record, string, optional } from 'superstruct'
import { Localised } from '@openlab/deconf-shared'

/** `LocalisedStruct` validates an object is a `Localised` */
export const LocalisedStruct: Describe<Localised> = record(
  string(),
  optional(string())
)
