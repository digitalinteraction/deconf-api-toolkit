//
// Localised
//

import { Describe, record, string } from 'superstruct'
import { Localised } from '@openlab/deconf-shared'

export const LocalisedStruct: Describe<Localised> = record(string(), string())
