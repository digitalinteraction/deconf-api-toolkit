import { Describe, object, string } from 'superstruct'
import { InterpretBooth } from '@openlab/deconf-shared'

export const InterpretBoothStruct: Describe<InterpretBooth> = object({
  sessionId: string(),
  channel: string(),
})
