//
// RegisterBody - the fields needed to register
//

import { boolean, date, Infer, number, object, size, string } from 'superstruct'

//
// Registration
//
export type Registration = Infer<typeof RegistrationStruct>
export const RegistrationStruct = object({
  id: number(),
  created: date(),
  name: string(),
  email: string(),
  language: string(),
  country: string(),
  affiliation: string(),
  verified: boolean(),
  consented: date(),
})
