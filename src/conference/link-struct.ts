//
// Link
//

import { Describe, object, optional, string } from 'superstruct'
import { SessionLink } from '@openlab/deconf-shared'

export const SessionLinkStruct: Describe<SessionLink> = object({
  type: string(),
  url: string(),
  title: optional(string()),
  language: string(),
})
