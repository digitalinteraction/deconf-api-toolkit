import { ApiError } from '../api-error'
import { getRedirectErrorCode, trimEmail } from '../utils'

describe('getRedirectErrorCode', () => {
  it('should return not_found', async () => {
    expect(getRedirectErrorCode(ApiError.notFound())).toEqual('not_found')
  })
  it('should return login_expired', async () => {
    expect(
      getRedirectErrorCode(new ApiError(401, ['auth.tokenExpired']))
    ).toEqual('login_expired')
  })
})

describe('trimEmail', () => {
  it('should return lower-cased-trimmed emails', async () => {
    expect(trimEmail(' gEoFF@ExAmple.com ')).toEqual('geoff@example.com')
  })
})
