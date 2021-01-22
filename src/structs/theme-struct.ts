//
// Theme
//

import { Infer, object, string } from 'superstruct'
import { LocalisedStruct } from './localised-struct'

export type Theme = Infer<typeof ThemeStruct>
export const ThemeStruct = object({
  id: string(),
  title: LocalisedStruct,
})
