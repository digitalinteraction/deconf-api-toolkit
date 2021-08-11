//
// RegisterBody - the fields needed to register
//

import { boolean, date, Describe, number, object, string } from 'superstruct'
import { Registration } from '@openlab/deconf-shared'

//
// Registration
//
export const RegistrationStruct: Describe<Registration> = object({
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
