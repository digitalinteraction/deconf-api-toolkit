//
// Translator
//

import { Describe, object, string } from 'superstruct'
import { Interpreter } from '@openlab/deconf-shared'

export const InterpreterStruct: Describe<Interpreter> = object({
  id: string(),
  name: string(),
  email: string(),
})
