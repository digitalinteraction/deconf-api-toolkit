//
// ConfigSettings
//

import { boolean, date, Infer, object } from 'superstruct'

// enabled | visible | result
// ------- | ------- | ----
// true    | true    | active
// false   | true    | coming soon
// true    | false   | hidden
// false   | false   | hidden
const Flag = object({
  enabled: boolean(),
  visible: boolean(),
})

export type ConfigSettings = Infer<typeof ConfigSettingsStruct>
export const ConfigSettingsStruct = object({
  atrium: Flag,
  whatsOn: Flag,
  schedule: Flag,
  coffeeChat: Flag,
  helpdesk: Flag,

  startDate: date(),
  endDate: date(),
  isStatic: boolean(),
})
