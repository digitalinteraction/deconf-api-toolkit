import { mockConferenceService } from '../../services/__mocks__'
import { mockQueryService } from '../../services/__mocks__'
import { createAttendanceModule } from '../attendance-module'

import { mocked } from 'ts-jest/utils'
import { AuthToken } from '../../services'

function setup() {
  const registration: any = { id: 123 }
  const conference = mockConferenceService()
  const query = mockQueryService()
  const attendModule = createAttendanceModule({ conference, query })
  const authToken: AuthToken = {
    kind: 'auth',
    sub: 123,
    user_roles: ['attendee'],
    user_lang: 'en',
  }

  return { registration, attendModule, conference, query, authToken }
}

describe('attend', () => {
  it('should return a http/200', async () => {
    const { attendModule, registration, conference, query, authToken } = setup()
    mocked(conference.findSession).mockResolvedValue({} as any)
    mocked(query.getVerifiedRegistration).mockResolvedValue(registration)

    const response = await attendModule.attend(authToken, 'session-2')

    expect(response.status).toEqual(200)
  })
  it('should mark the user as going', async () => {
    const { attendModule, registration, conference, query, authToken } = setup()
    mocked(conference.findSession).mockResolvedValue({} as any)
    mocked(query.getVerifiedRegistration).mockResolvedValue(registration)

    await attendModule.attend(authToken, 'session-2')

    expect(query.attend).toBeCalledWith(123, 'session-2')
  })
})

describe('unattend', () => {
  it('should return a http/200', async () => {
    const { attendModule, registration, conference, query, authToken } = setup()
    mocked(conference.findSession).mockResolvedValue({} as any)
    mocked(query.getVerifiedRegistration).mockResolvedValue(registration)

    const response = await attendModule.unattend(authToken, 'session-2')

    expect(response.status).toEqual(200)
  })
  it('should remove the user attendance', async () => {
    const { attendModule, registration, conference, query, authToken } = setup()
    mocked(conference.findSession).mockResolvedValue({} as any)
    mocked(query.getVerifiedRegistration).mockResolvedValue(registration)

    await attendModule.unattend(authToken, 'session-2')

    expect(query.unattend).toBeCalledWith(123, 'session-2')
  })
})

describe('getAttendance', () => {
  it('should return a http/200', async () => {
    const { attendModule, registration, conference, query, authToken } = setup()
    mocked(conference.findSession).mockResolvedValue({} as any)
    mocked(query.getVerifiedRegistration).mockResolvedValue(registration)
    mocked(query.getUserAttendance).mockResolvedValue([
      { id: 1, created: new Date(), attendee: 123, session: 'session-2' },
    ])

    const response = await attendModule.getAttendance(authToken, 'session-2')

    expect(response.status).toEqual(200)
  })
  it('should return their attendance', async () => {
    const { attendModule, registration, conference, query, authToken } = setup()
    mocked(conference.findSession).mockResolvedValue({} as any)
    mocked(query.getVerifiedRegistration).mockResolvedValue(registration)
    mocked(query.getUserAttendance).mockResolvedValue([
      { id: 1, created: new Date(), attendee: 123, session: 'session-2' },
    ])

    const response = await attendModule.getAttendance(authToken, 'session-2')

    expect(response.body).toEqual({
      isAttending: true,
      attendance: {
        id: 1,
        created: expect.any(Date),
        attendee: 123,
        session: 'session-2',
      },
    })
  })
})
