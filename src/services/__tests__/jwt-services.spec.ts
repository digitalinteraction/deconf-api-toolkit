import { createJwtService } from '../jwt-service'
import jwt = require('jsonwebtoken')
import { mocked } from 'ts-jest/utils'

jest.mock('jsonwebtoken')

function setup() {
  const service = createJwtService('top_secret')
  return { service }
}

describe('sign', () => {
  it('should sign the payload', () => {
    const { service } = setup()

    service.sign({ test: 'payload' }, { expiresIn: 5000 })

    expect(jwt.sign).toBeCalledWith({ test: 'payload' }, 'top_secret', {
      expiresIn: 5000,
    })
  })
  it('should return the signed jwt', () => {
    const { service } = setup()
    mocked<any>(jwt.sign).mockReturnValue('some_json_web_token')

    const result = service.sign({ test: 'payload' }, { expiresIn: 5000 })

    expect(result).toEqual('some_json_web_token')
  })
})

describe('verify', () => {
  it('should verify the payload', () => {
    const { service } = setup()

    service.verify('some_json_web_token')

    expect(jwt.verify).toBeCalledWith('some_json_web_token', 'top_secret')
  })
  it('should return the verifyed jwt', () => {
    const { service } = setup()
    mocked<any>(jwt.verify).mockReturnValue({ test: 'payload' })

    const result = service.verify('some_json_web_token')

    expect(result).toEqual({ test: 'payload' })
  })
})
