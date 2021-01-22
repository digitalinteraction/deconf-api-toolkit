import jwt = require('jsonwebtoken')

// From jwt.SignOptions, add more fields as they are needed
export interface JwtSignOptions {
  expiresIn: string | number
}

export interface JwtService {
  sign(payload: object | string, signOptions?: JwtSignOptions): string
  verify(token: string): string | object
}

export function createJwtService(secretKey: string): JwtService {
  return {
    sign(payload, signOptions) {
      return jwt.sign(payload, secretKey, signOptions)
    },
    verify(token) {
      return jwt.verify(token, secretKey)
    },
  }
}
