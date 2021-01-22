//
// Session
//

import {
  array,
  boolean,
  enums,
  Infer,
  object,
  optional,
  string,
} from 'superstruct'
import { LinkStruct } from './link-struct'
import { LocalisedStruct } from './localised-struct'

export enum SessionState {
  draft = 'draft',
  accepted = 'accepted',
  rejected = 'rejected',
  cancelled = 'cancelled',
}

export enum SessionVisibility {
  public = 'public',
  private = 'private',
}

export type Session = Infer<typeof SessionStruct>
export const SessionStruct = object({
  id: string(),
  type: string(),
  slot: optional(string()),
  track: string(),
  themes: array(string()),
  coverImage: string(),
  title: LocalisedStruct,
  content: LocalisedStruct,
  links: array(LinkStruct),
  // hostName: string(),
  // hostEmail: string(),
  hostLanguage: array(string()),
  enableInterpretation: boolean(),
  speakers: array(string()),
  hostOrganisation: LocalisedStruct,
  isRecorded: boolean(),
  // attendeeInteraction: enums(['view', 'q-and-a', 'workshop', 'games']),
  // attendeeDevices: enums(['desktop', 'mobile', 'all']),
  isOfficial: boolean(),
  // isDraft: boolean(),
  isFeatured: boolean(),
  // isCancelled: optional(boolean()),
  // isPublic: optional(boolean()),
  visibility: enums(Object.values(SessionVisibility)),
  state: enums(Object.values(SessionState)),

  proxyUrl: optional(string()),
  hideFromSchedule: optional(boolean()),
})
