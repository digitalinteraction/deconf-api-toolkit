import { enums, Infer, object, string } from 'superstruct'

export type InterpretBooth = Infer<typeof InterpretBoothStruct>

export const InterpretBoothStruct = object({
  sessionId: string(),
  channel: enums(['en', 'fr', 'es', 'ar']),
})
