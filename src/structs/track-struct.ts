//
// Track
//

import { Infer, object, string } from 'superstruct'
import { LocalisedStruct } from './localised-struct'

export type Track = Infer<typeof TrackStruct>
export const TrackStruct = object({
  id: string(),
  title: LocalisedStruct,
})
