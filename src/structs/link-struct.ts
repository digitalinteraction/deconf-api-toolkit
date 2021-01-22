//
// Link
//

import { enums, Infer, object, optional, string } from 'superstruct'

export type Link = Infer<typeof LinkStruct>
export const LinkStruct = object({
  type: string(),
  url: string(),
  title: optional(string()),
  language: string(),
})
