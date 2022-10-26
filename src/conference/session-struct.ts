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
import { LocalisedLinkStruct } from './link-struct.js'
import { LocalisedStruct } from './localised-struct.js'

import {
  Session,
  SessionState,
  SessionVisibility,
} from '@openlab/deconf-shared'

/** `SessionStruct` validates an object is a deconf `Session` */
export const SessionStruct: Describe<Session> = object({
  id: string(),
  type: string(),
  slot: optional(string()),
  track: string(),
  themes: array(string()),
  coverImage: optional(string()),
  title: LocalisedStruct,
  content: LocalisedStruct,
  links: array(LocalisedLinkStruct),
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
