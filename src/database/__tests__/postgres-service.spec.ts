import { mocked } from 'ts-jest/utils'
import pg from 'pg'

import { composeSql, PostgresService } from '../../database/postgres-service'
import { createTestingEnv } from '../../lib/env'
import { mockPostgresClient } from '../../test-lib/module'

jest.mock('pg')

function setup() {
  mocked(pg.Pool).mockClear()
  const env = createTestingEnv()
  const service = new PostgresService({ env })
  const pool = mocked(pg.Pool).mock.instances[0]
  const poolClient = {
    release: jest.fn(),
    query: jest.fn(async () => Promise.resolve({ rows: [] })),
  }
  return { service, pool, poolClient }
}

describe('composeSql', () => {
  it('should keep simple queries as text', () => {
    const result = composeSql`SELECT * FROM users`

    expect(result).toEqual({
      text: 'SELECT * FROM users',
      values: [],
    })
  })
  it('should compose a query with values', () => {
    const email = 'geoff@evil.corp'
    const result = composeSql`SELECT * FORM users WHERE email=${email}`

    expect(result).toEqual({
      text: 'SELECT * FORM users WHERE email=$1',
      values: ['geoff@evil.corp'],
    })
  })
  it('should compose multiple values', () => {
    const email = 'geoff@evil.corp'
    const age = 42

    const result = composeSql`SELECT * FROM users WHERE email=${email} AND age > ${age}`

    expect(result).toEqual({
      text: 'SELECT * FROM users WHERE email=$1 AND age > $2',
      values: ['geoff@evil.corp', 42],
    })
  })
})

describe('PostgresService', () => {
  describe('run', () => {
    it('should create a client and run the block with it', async () => {
      const { service, pool, poolClient } = setup()
      mocked<any>(pool.connect).mockResolvedValue(poolClient)

      await service.run((client) => client.sql`SELECT true`)

      expect(poolClient.query).toBeCalledWith({
        text: 'SELECT true',
        values: [],
      })
    })

    it('should release the client afterwards', async () => {
      const { service, pool, poolClient } = setup()
      mocked<any>(pool.connect).mockResolvedValue(poolClient)

      await service.run((client) => client.sql`SELECT true`)

      expect(poolClient.release).toBeCalled()
    })

    it('should reuse the client if passed one', async () => {
      const { service, pool } = setup()
      const client = mockPostgresClient()

      await service.run((client) => client.sql`SELECT true`, client)

      expect(pool.connect).not.toBeCalled()
      expect(client.release).not.toBeCalled()
    })
  })

  describe('close', () => {
    it('should close the pool connection ', async () => {
      const { service, pool } = setup()

      await service.close()

      expect(pool.end).toBeCalled()
    })
  })

  describe('getClient', () => {
    it('should make a pool client', async () => {
      const { service, pool, poolClient } = setup()
      mocked<any>(pool.connect).mockResolvedValue(poolClient)

      const client = await service.getClient()

      expect(client).toEqual({
        release: expect.any(Function),
        sql: expect.any(Function),
      })
    })

    describe('release', () => {
      it('should release the client', async () => {
        const { service, pool, poolClient } = setup()
        mocked<any>(pool.connect).mockResolvedValue(poolClient)
        const client = await service.getClient()

        client.release()

        expect(poolClient.release).toBeCalled()
      })
    })
    describe('query', () => {
      it('should parse and execute a query with parameters', async () => {
        const { service, pool, poolClient } = setup()
        mocked<any>(pool.connect).mockResolvedValue(poolClient)
        const client = await service.getClient()

        client.sql`SELECT ${true}`

        expect(poolClient.query).toBeCalledWith({
          text: 'SELECT $1',
          values: [true],
        })
      })
    })
  })
})
