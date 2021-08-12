import { checkEnvObject, pluck } from 'valid-env'

export type DeconfEnv = ReturnType<typeof createEnv>

export function createEnv(processEnv = process.env) {
  const { NODE_ENV = 'production' } = processEnv

  return checkEnvObject({
    ...pluck(
      processEnv,
      'SENDGRID_API_KEY',
      'JWT_SECRET',
      'DATABASE_URL',
      'SELF_URL',
      'CLIENT_URL'
    ),
    NODE_ENV,
  })
}

export function createTestingEnv(): DeconfEnv {
  return {
    NODE_ENV: 'testing',
    SENDGRID_API_KEY: 'not_secret',
    JWT_SECRET: 'not_secret',
    DATABASE_URL: 'postgresql://user:secret@127.0.0.1/user',
    SELF_URL: 'http://localhost:3000',
    CLIENT_URL: 'http://localhost:8080',
  }
}
