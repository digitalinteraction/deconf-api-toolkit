//
// Slot
//

import { date, Describe, object, string } from 'superstruct'
import { SessionSlot } from '@openlab/deconf-shared'

/** `SessionSlotStruct` validates an object is a deconf `SessionSlot` */
export const SessionSlotStruct: Describe<SessionSlot> = object({
  id: string(),
  start: date(),
  end: date(),
})
