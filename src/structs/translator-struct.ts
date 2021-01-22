//
// Translator
//

import { Infer, object, string } from 'superstruct'

export type Interpreter = Infer<typeof InterpreterStruct>
export const InterpreterStruct = object({
  id: string(),
  name: string(),
  email: string(),
})
