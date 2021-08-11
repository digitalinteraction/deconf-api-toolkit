//
// Register request
//

import { Describe, object, string } from 'superstruct'
import { RegisterRequest } from '@openlab/deconf-shared'

export const RegisterRequestStruct: Describe<RegisterRequest> = object({
  name: string(),
  email: string(),
  language: string(),
  country: string(),
  affiliation: string(),
})
