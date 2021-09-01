//
// Slot
//

import { date, Describe, object, string } from 'superstruct'
import { SessionSlot } from '@openlab/deconf-shared'

export const SessionSlotStruct: Describe<SessionSlot> = object({
  id: string(),
  start: date(),
  end: date(),
})
