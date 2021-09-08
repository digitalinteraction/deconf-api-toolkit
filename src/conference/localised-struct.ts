//
// Localised
//

import { Describe, record, string, optional } from 'superstruct'
import { Localised } from '@openlab/deconf-shared'

export const LocalisedStruct: Describe<Localised> = record(
  string(),
  optional(string())
)
