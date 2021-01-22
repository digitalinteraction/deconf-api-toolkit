//
// Slot
//

import { date, Infer, object, string } from 'superstruct'

export type Slot = Infer<typeof SlotStruct>
export interface SlotJson {
  id: string
  start: string
  end: string
}

export const SlotStruct = object({
  id: string(),
  start: date(),
  end: date(),
})
