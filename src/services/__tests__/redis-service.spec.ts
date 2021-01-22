import { createRedisService } from '../redis-service'
import Redis = require('ioredis')
import { mocked } from 'ts-jest/utils'

jest.mock('ioredis')

function setup() {
  mocked(Redis).mockClear()

  const service = createRedisService('redis://localhost:6379')
  const client = mocked(Redis).mock.instances[0]
  return { service, client }
}

// describe('ping', () => {
//   it('should fail if the client is not ready', () => {
//     const { service, client } = setup()

//     Object.assign(client, { status: 'not_ready' })
//     const call = () => service.ping()

//     expect(call).rejects.toThrow(/Not connected/)
//   })
//   it('should call #ping', async () => {
//     const { service, client } = setup()

//     await service.ping()

//     expect(client.ping).toBeCalled()
//   })
// })

describe('close', () => {
  it('should close the client', async () => {
    const { service, client } = setup()

    await service.close()

    expect(client.quit).toBeCalled()
  })
})

describe('get', () => {
  it('should get from the client', async () => {
    const { service, client } = setup()
    mocked(client.get).mockResolvedValue('Geoff')

    const value = await service.get('name')

    expect(client.get).toBeCalledWith('name')
    expect(value).toEqual('Geoff')
  })
})

describe('getJson', () => {
  it('should get from redis', async () => {
    const { service, client } = setup()
    mocked(client.get).mockResolvedValue('{"name": "Geoff"}')

    await service.getJson('name', null)

    expect(client.get).toBeCalledWith('name')
  })
  it('parse json from the value', async () => {
    const { service, client } = setup()
    mocked(client.get).mockResolvedValue('{"name": "Geoff"}')

    const result = await service.getJson('name', null)

    expect(result).toEqual({
      name: 'Geoff',
    })
  })
  it('should return a fallback value if none exists', async () => {
    const { service, client } = setup()
    mocked(client.get).mockResolvedValue(null)

    const result = await service.getJson('name', 'fallback-value')

    expect(result).toEqual('fallback-value')
  })
  it('should return the fallback value if it is not json', async () => {
    const { service, client } = setup()
    mocked(client.get).mockResolvedValue('Not a JSON string 42')

    const result = await service.getJson('name', 'fallback-value')

    expect(result).toEqual('fallback-value')
  })
})

describe('set', () => {
  it('should set on the client', async () => {
    const { service, client } = setup()

    await service.set('key', 'value')

    expect(client.set).toBeCalledWith('key', 'value')
  })
})

describe('setJson', () => {
  it('should set on the client with stringified json', async () => {
    const { service, client } = setup()

    await service.setJson('key', { name: 'Geoff' })

    expect(client.set).toBeCalledWith('key', '{"name":"Geoff"}')
  })
})

describe('setExpiry', () => {
  it('should tell the client to expire that key', async () => {
    const { service, client } = setup()

    await service.setExpiry('key', 500)

    expect(client.expire).toBeCalledWith('key', 500)
  })
})

describe('delete', () => {
  it('should tell the client to delete that key', async () => {
    const { service, client } = setup()

    await service.delete('key')

    expect(client.del).toBeCalledWith('key')
  })
})
