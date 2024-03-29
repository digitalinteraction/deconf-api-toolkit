//
// ConfigSettings
//

import { boolean, date, Describe, object } from 'superstruct'
import { PageFlag, ConferenceConfig } from '@openlab/deconf-shared'

/**
 * `PageFlagStruct` validates an object is a `PageFlag`
 *
 * | enabled | visible | result
 * | ------- | ------- | ----
 * | true    | true    | active
 * | false   | true    | coming soon
 * | true    | false   | hidden
 * | false   | false   | hidden
 */
export const PageFlagStruct: Describe<PageFlag> = object({
  enabled: boolean(),
  visible: boolean(),
})

/**
 * `ConferenceConfigStruct` validates an object is a `ConferenceConfig`
 */
export const ConferenceConfigStruct: Describe<ConferenceConfig> = object({
  atrium: PageFlagStruct,
  whatsOn: PageFlagStruct,
  schedule: PageFlagStruct,
  coffeeChat: PageFlagStruct,
  helpDesk: PageFlagStruct,

  startDate: date(),
  endDate: date(),
  isStatic: boolean(),
})
