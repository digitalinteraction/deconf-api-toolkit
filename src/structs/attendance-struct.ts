//
// Attendance
//

import { date, Describe, number, object, string } from 'superstruct'
import { Attendance } from '@openlab/deconf-shared'

export const AttendanceStruct: Describe<Attendance> = object({
  id: number(),
  created: date(),
  attendee: number(),
  session: string(),
})
