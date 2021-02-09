import { AuthToken } from '@openlab/deconf-shared'

const bearerRegex = /^bearer /i

/**
 * A service for authenticating socket and route logic
 */
export interface AuthenticationService {
  fromSocketId(socketId: string): Promise<AuthToken | null>
  fromRequestHeaders(headers: any): Promise<AuthToken | null>
}

export function createAuthenticationService(
  lookup: (key: string) => Promise<object | null>,
  verifyToken: (token: string) => any
): AuthenticationService {
  return {
    async fromSocketId(socketId: string) {
      return lookup(`auth_${socketId}`) as Promise<AuthToken | null>
    },
    async fromRequestHeaders(headers: any) {
      const { authorization = '' } = headers
      if (!bearerRegex.test(authorization)) return null

      const token = authorization.replace(bearerRegex, '')
      try {
        const auth = verifyToken(token) as AuthToken
        if (typeof auth !== 'object') return null
        return auth
      } catch (error) {
        return null
      }
    },
  }
}
