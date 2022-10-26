//
// Track
//

import { Describe, object, string } from 'superstruct'
import { LocalisedStruct } from './localised-struct.js'
import { Track } from '@openlab/deconf-shared'

/** `TrackStruct` validates an object is a deconf `Track` */
export const TrackStruct: Describe<Track> = object({
  id: string(),
  title: LocalisedStruct,
})
