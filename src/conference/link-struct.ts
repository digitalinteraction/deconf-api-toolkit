//
// Link
//

import { Describe, object, optional, string } from 'superstruct'
import { LocalisedLink } from '@openlab/deconf-shared'

/** `LocalisedLinkStruct` validates an object is a `LocalisedLink` */
export const LocalisedLinkStruct: Describe<LocalisedLink> = object({
  type: string(),
  url: string(),
  title: optional(string()),
  language: string(),
})

/** @deprecated use `LocalisedLinkStruct` */
export const SessionLinkStruct = LocalisedLinkStruct
