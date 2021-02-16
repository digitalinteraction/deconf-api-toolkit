//
// Session
//

import {
  array,
  boolean,
  enums,
  Describe,
  object,
  optional,
  string,
  nullable,
  number,
} from 'superstruct'
import { SessionLinkStruct } from './link-struct'
import { LocalisedStruct } from './localised-struct'
import {
  Session,
  SessionState,
  SessionVisibility,
} from '@openlab/deconf-shared'

export const SessionStruct: Describe<Session> = object({
  id: string(),
  type: string(),
  slot: optional(string()),
  track: string(),
  themes: array(string()),
  coverImage: optional(string()),
  title: LocalisedStruct,
  content: LocalisedStruct,
  links: array(SessionLinkStruct),
  hostLanguages: array(string()),
  enableInterpretation: boolean(),
  speakers: array(string()),
  hostOrganisation: LocalisedStruct,
  isRecorded: boolean(),
  isOfficial: boolean(),
  isFeatured: boolean(),
  visibility: enums(Object.values(SessionVisibility)),
  state: enums(Object.values(SessionState)),
  participantCap: nullable(number()),
  proxyUrl: optional(string()),
  hideFromSchedule: boolean(),
})

// removed:
// hostName: string(),
// hostEmail: string(),
// attendeeInteraction: enums(['view', 'q-and-a', 'workshop', 'games']),
// attendeeDevices: enums(['desktop', 'mobile', 'all']),
// isDraft: boolean(),
// isCancelled: optional(boolean()),
// isPublic: optional(boolean()),
