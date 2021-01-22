import { mocked } from 'ts-jest/utils'
import { AuthToken } from '../../services'
import {
  mockEmailService,
  mockJwtService,
  mockQueryService,
} from '../../services/__mocks__/'
import { Registration } from '../../structs'
import { createAccountsModule } from '../accounts-module'

function setup() {
  const jwt = mockJwtService()
  const query = mockQueryService()
  const email = mockEmailService()

  const accounts = createAccountsModule({ query, jwt, email })
  const authToken: AuthToken = {
    kind: 'auth',
    sub: 123,
    user_roles: ['attendee'],
    user_lang: 'en',
  }
  const registration: Registration = {
    id: 123,
    created: new Date(),
    name: 'Geoff Testington',
    email: 'geoff@evil.corp',
    language: 'en',
    country: 'en',
    affiliation: 'Open Lab',
    verified: true,
    consented: new Date(),
  }

  return { accounts, authToken, registration, query, jwt, email }
}

describe('me', () => {
  it('should return http/401 with no authentication', async () => {
    const { accounts } = setup()

    const res = await accounts.getRegistration(null)

    expect(res.status).toEqual(401)
  })
  it('should return the user based on their authentication', async () => {
    const { accounts, authToken, query, registration } = setup()
    mocked(query.getVerifiedRegistration).mockResolvedValue(registration)

    const res = await accounts.getRegistration(authToken)

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({ user: registration })
  })
  it('should check for verified registrations for the subject', async () => {
    const { accounts, authToken, query, registration } = setup()

    await accounts.getRegistration(authToken)

    expect(query.getVerifiedRegistration).toBeCalledWith(123)
  })
})

describe('startEmailLogin', () => {
  it('should fail for bad emails', async () => {
    const { accounts, query } = setup()
    mocked(query.findRegistrations).mockResolvedValue([])

    const res = await accounts.startEmailLogin('not_an_email')

    expect(res.status).toEqual(400)
  })
  it('should get the registration', async () => {
    const { accounts, query } = setup()
    mocked(query.findRegistrations).mockResolvedValue([])

    await accounts.startEmailLogin('geoff@evil.corp')

    expect(query.findRegistrations).toBeCalledWith('geoff@evil.corp')
  })
  it('should sign a verification token for 30 minutes', async () => {
    const { accounts, jwt, registration, query } = setup()
    mocked(query.findRegistrations).mockResolvedValue([registration])

    await accounts.startEmailLogin('geoff@evil.corp')

    expect(jwt.sign).toBeCalledWith(
      {
        kind: 'email-login',
        sub: 123,
        user_roles: ['attendee'],
      },
      {
        expiresIn: '30m',
      }
    )
  })
  it('should send an email to log the user in', async () => {
    const { accounts, jwt, registration, query, email } = setup()
    mocked(query.findRegistrations).mockResolvedValue([registration])
    mocked(jwt.sign).mockReturnValue('fake.jwt.string')

    await accounts.startEmailLogin('geoff@evil.corp')

    expect(email.sendLoginEmail).toBeCalledWith(
      'geoff@evil.corp',
      'fake.jwt.string',
      'en'
    )
  })
  it('should return a http/200', async () => {
    const { accounts, jwt, registration, query, email } = setup()
    mocked(query.findRegistrations).mockResolvedValue([registration])
    mocked(jwt.sign).mockReturnValue('fake.jwt.string')

    const res = await accounts.startEmailLogin('geoff@evil.corp')

    expect(res.status).toEqual(200)
  })
})
