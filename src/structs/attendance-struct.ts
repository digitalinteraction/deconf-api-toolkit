//
// Attendance
//

import { date, Infer, number, object, string } from 'superstruct'

export type Attendance = Infer<typeof AttendanceStruct>
export const AttendanceStruct = object({
  id: number(),
  created: date(),
  attendee: number(),
  session: string(),
})
