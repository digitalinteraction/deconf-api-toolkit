import * as index from '../index'

it('should export the attendance module', () => {
  expect(index.AttendanceRoutes).toBeDefined()
})

it('should export the carbon module', () => {
  expect(index.CarbonRoutes).toBeDefined()
})

it('should export the conference module', () => {
  expect(index.ConferenceRoutes).toBeDefined()
})

it('should export the database module', () => {
  expect(index.PostgresService).toBeDefined()
})

// TODO:
// it('should export the interpret module', () => {
//   expect(index.AttendanceRoutes).toBeDefined()
// })

it('should export the library module', () => {
  expect(index.EmailService).toBeDefined()
})

it('should export the registration module', () => {
  expect(index.RegistrationRoutes).toBeDefined()
})

it('should export the pretalx module', () => {
  expect(index.PretalxService).toBeDefined()
})
