import { date, Describe, number, object, string } from 'superstruct'
import { Attendance } from '@openlab/deconf-shared'

/**
 * `AttendanceStruct` validates an object is a `Attendance`
 */
export const AttendanceStruct: Describe<Attendance> = object({
  id: number(),
  created: date(),
  attendee: number(),
  session: string(),
})
