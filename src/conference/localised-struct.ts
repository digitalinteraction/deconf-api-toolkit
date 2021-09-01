//
// Localised
//

import { Describe, record, string, optional, never } from 'superstruct'
import { Localised } from '@openlab/deconf-shared'

export const LocalisedStruct: Describe<Localised> = record(
  string(),
  optional(string())
)
