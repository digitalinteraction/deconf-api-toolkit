//
// ConfigSettings
//

import { boolean, date, Describe, Infer, object } from 'superstruct'
import { ConfigFlag, ConfigSettings } from '@openlab/deconf-shared'

// enabled | visible | result
// ------- | ------- | ----
// true    | true    | active
// false   | true    | coming soon
// true    | false   | hidden
// false   | false   | hidden
const Flag: Describe<ConfigFlag> = object({
  enabled: boolean(),
  visible: boolean(),
})

export const ConfigSettingsStruct: Describe<ConfigSettings> = object({
  atrium: Flag,
  whatsOn: Flag,
  schedule: Flag,
  coffeeChat: Flag,
  helpDesk: Flag,

  startDate: date(),
  endDate: date(),
  isStatic: boolean(),
})
