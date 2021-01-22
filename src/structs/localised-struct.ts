//
// Localised
//

import { Infer, record, string } from 'superstruct'

export type Localised = Infer<typeof LocalisedStruct>
export const LocalisedStruct = record(string(), string())
