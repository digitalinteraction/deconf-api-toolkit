//
// Theme
//

import { Describe, object, string } from 'superstruct'
import { LocalisedStruct } from './localised-struct'
import { Theme } from '@openlab/deconf-shared'

export const ThemeStruct: Describe<Theme> = object({
  id: string(),
  title: LocalisedStruct,
})
