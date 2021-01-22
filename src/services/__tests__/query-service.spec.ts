import { mocked } from 'ts-jest/utils'
import dedent = require('dedent')
import { createQueryService, getVerifiedRegistration } from '../query-service'
import { mockPostgresClient, mockPostgresService } from '../__mocks__'

function setup() {
  const pg = mockPostgresService()

  const service = createQueryService(pg)

  return { pg, service }
}

describe('getVerifiedRegistration', () => {
  it('should return the registration', async () => {
    const { pg } = setup()
    mocked(pg.mockClient._query).mockResolvedValue([
      { id: '1', email: 'geoff@evil.corp', verified: false },
    ])

    const result = await getVerifiedRegistration(pg.mockClient, 1)

    expect(result).toEqual({
      id: '1',
      email: 'geoff@evil.corp',
      verified: false,
    })
  })
})

//
// I'm not sure how to test these SQL functions
//
