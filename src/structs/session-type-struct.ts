//
// Type
//

import { Infer, object, string } from 'superstruct'
import { LocalisedStruct } from './localised-struct'

export enum SessionLayout {
  plenary = 'plenary',
  workshop = 'workshop',
  coffeechat = 'coffeechat',
}

export type SessionType = Infer<typeof SessionTypeStruct>
export const SessionTypeStruct = object({
  id: string(),
  iconGroup: string(),
  iconName: string(),
  layout: string(),
  title: LocalisedStruct,
})
