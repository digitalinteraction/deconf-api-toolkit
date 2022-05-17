//
// Type
//

import { Describe, object, string } from 'superstruct'
import { LocalisedStruct } from './localised-struct'
import { SessionType } from '@openlab/deconf-shared'

/** `SessionTypeStruct` validates an object is a deconf `SessionType` */
export const SessionTypeStruct: Describe<SessionType> = object({
  id: string(),
  iconGroup: string(),
  iconName: string(),
  layout: string(),
  title: LocalisedStruct,
})
