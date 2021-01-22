import {
  PostgresClient,
  PostgresService,
  composeSql,
} from '../postgres-service'

//
// Test usage of a mocked PostgresClient:
// 1 - code calls client.sql`SOME SQL ${variable}`
// 2 - fake return value with mocked(client._query).mockResolvedValue(...)
// 3 - test the query ran with expect(client.query).toBeCalledWith({ text: '', values: [] })
//

interface ClientExtras {
  query: jest.Mock
  _query: jest.Mock
}

export function mockPostgresClient(): PostgresClient & ClientExtras {
  const _query = jest.fn()
  const query = jest.fn((q) => _query(q))
  return {
    release: jest.fn(),
    sql: jest.fn(async (...args) => query(composeSql(...args))),
    query,
    _query,
  }
}

export function mockPostgresService(): PostgresService & {
  mockClient: PostgresClient & ClientExtras
} {
  const mockClient = mockPostgresClient()
  return {
    run: jest.fn(),
    getClient: jest.fn(async () => mockClient),
    close: jest.fn(),
    mockClient,
  }
}
