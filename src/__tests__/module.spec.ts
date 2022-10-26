import * as index from '../module.js'

it('should export the attendance module.js', () => {
  expect(index.AttendanceRoutes).toBeDefined()
})

it('should export the carbon module.js', () => {
  expect(index.CarbonRoutes).toBeDefined()
})

it('should export the conference module.js', () => {
  expect(index.ConferenceRoutes).toBeDefined()
})

it('should export the database module.js', () => {
  expect(index.PostgresService).toBeDefined()
})

it('should export the interpret module.js', () => {
  expect(index.InterpreterSockets).toBeDefined()
})

it('should export the library module.js', () => {
  expect(index.EmailService).toBeDefined()
})

it('should export the metrics module.js', () => {
  expect(index.MetricsRepository).toBeDefined()
})

it('should export the pretalx module.js', () => {
  expect(index.PretalxService).toBeDefined()
})

it('should export the registration module.js', () => {
  expect(index.RegistrationRoutes).toBeDefined()
})

it('should export the content module.js', async () => {
  expect(index.ContentService).toBeDefined()
})
