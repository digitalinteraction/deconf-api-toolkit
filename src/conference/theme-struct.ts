//
// Theme
//

import { Describe, object, string } from 'superstruct'
import { LocalisedStruct } from './localised-struct'
import { Theme } from '@openlab/deconf-shared'

/** `ThemeStruct` validates an object is a deconf `Theme` */
export const ThemeStruct: Describe<Theme> = object({
  id: string(),
  title: LocalisedStruct,
})
