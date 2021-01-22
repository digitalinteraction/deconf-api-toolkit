//
// Register request
//

import { Infer, object, string } from 'superstruct'

export type RegisterRequest = Infer<typeof RegisterRequestStruct>
export const RegisterRequestStruct = object({
  name: string(),
  email: string(),
  language: string(),
  country: string(),
  affiliation: string(),
})
