//
// Track
//

import { Describe, object, string } from 'superstruct'
import { LocalisedStruct } from './localised-struct'
import { Track } from '@openlab/deconf-shared'

export const TrackStruct: Describe<Track> = object({
  id: string(),
  title: LocalisedStruct,
})
