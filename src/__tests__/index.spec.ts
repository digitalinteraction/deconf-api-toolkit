import * as index from '../index'

it('should export modules', () => {
  expect(index.createAccountsModule).toBeDefined()
})

it('should export services', () => {
  expect(index.createConferenceService).toBeDefined()
})

it('should export HttpResponse', () => {
  expect(index.HttpResponse).toBeDefined()
})

it('should export structs', () => {
  expect(index.RegistrationStruct).toBeDefined()
})
