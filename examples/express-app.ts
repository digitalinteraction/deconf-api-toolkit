import express from 'express'
import dotenv from 'dotenv'
import { checkEnvObject, pluck } from 'valid-env'

import * as lib from '../src'

//
// Construct a typed environment object from process.env
//
type EnvRecord = ReturnType<typeof createEnv>
function createEnv(env = process.env) {
  dotenv.config({ path: 'examples/.env' })

  return checkEnvObject(
    pluck(
      env,
      'REDIS_URL',
      'JWT_SECRET',
      'POSTGRES_URL',
      'API_URL',
      'WEBSITE_URL'
    )
  )
}

//
// Fake locations to calculate carbon distance from
//
const carbonLocations: lib.CountryLocation[] = [
  {
    code: 'EN',
    name: 'United Kingdom',
    location: { lat: 1, lng: 2 },
  },
  {
    code: 'FR',
    name: 'France',
    location: { lat: 46.227638, lng: 2.213749 },
  },
]

//
// Translation locales
//
const locales = {
  en: {
    message: 'Hello, world!',
  },
}

//
// Create library services
// -> Here you can swap modules in and out to customise the server
//
async function createServices(env: EnvRecord) {
  const i18n = await lib.createI18nService(locales)
  const jwt = lib.createJwtService(env.JWT_SECRET)
  const pg = lib.createPostgresService(env.POSTGRES_URL)
  const redis = lib.createRedisService(env.REDIS_URL)
  const url = lib.createUrlService(env.API_URL, env.WEBSITE_URL)
  const query = lib.createQueryService(pg)
  const email: lib.EmailService = {
    async sendLoginEmail(emailAddress, loginToken, locale) {
      throw new Error('Not implemented')
    },
  }

  const conference = lib.createConferenceService((key, fallback) =>
    redis.getJson(key, fallback)
  )
  const auth = lib.createAuthenticationService(
    (key) => redis.getJson(key, null),
    (token) => jwt.verify(token)
  )

  return { i18n, jwt, pg, redis, conference, url, query, auth, email }
}

//
// This is a utility to wrap a module into an express route handler.
// With a generic to type the request's parameters (i.e. /:id)
// TODO: this could be moved into the lib - "toExpressRoute" perhaps?
//
function wrapper<Params = Record<string, string>>(
  block: (
    ...args: Parameters<express.RequestHandler<Params>>
  ) => Promise<lib.HttpResponse>
): express.RequestHandler<Params> {
  return async (req, res, next) => {
    const { status, body, headers } = await block(req, res, next)
    res.status(status)
    res.set(headers)
    res.send(body)
  }
}

//
// The entrypoint of the example app
//
async function main() {
  console.log('Starting')
  const env = createEnv()
  const app = express()

  console.log('Creating services')
  const services = await createServices(env)

  /** A utility to grab an authentication from an express request */
  function getToken(req: express.Request) {
    return services.auth.fromRequestHeaders(req.headers)
  }

  //
  // Run migrations
  //
  console.log('Running migrations')
  const migrate = lib.createMigrateModule(services)
  await migrate.runAll()

  //
  // Setup express routes
  //
  app.get('/', (req, res) => {
    res.send({ message: 'ok' })
  })

  //
  // Setup the accounts module
  //
  const accounts = lib.createAccountsModule(services)
  app.get(
    '/accounts/me',
    wrapper(async (req) => {
      const token = await getToken(req)
      return accounts.getRegistration(token)
    })
  )
  app.post(
    '/accounts/login',
    wrapper((req) => accounts.startEmailLogin(req.body?.email))
  )
  app.get(
    '/accounts/login/callback',
    wrapper((req) => accounts.finishEmailLogin(req.query.token))
  )
  app.post<{ name: string }>(
    '/accounts/register',
    wrapper((req) => accounts.startRegister(req.body))
  )
  app.get(
    '/accounts/register/callback',
    wrapper((req) => accounts.finishRegister(req.query.token))
  )
  app.delete(
    '/accounts/unregister',
    wrapper(async (req) => {
      const token = await getToken(req)
      return accounts.unregister(token)
    })
  )

  //
  // Setup the attendance module
  //
  type SessionIdParam = { session_id: string }

  const attendance = lib.createAttendanceModule(services)

  app.post<SessionIdParam>(
    '/attendance/attend/:session_id',
    wrapper(async (req) => {
      const token = await getToken(req)
      return attendance.attend(token, req.params.session_id)
    })
  )
  app.post<SessionIdParam>(
    '/attendance/unattend/:session_id',
    wrapper(async (req) => {
      const token = await getToken(req)
      return attendance.unattend(token, req.params.session_id)
    })
  )
  app.get<SessionIdParam>(
    '/attendance/:session_id',
    wrapper(async (req) => {
      const token = await getToken(req)
      return attendance.getAttendance(token, req.params.session_id)
    })
  )

  //
  // Setup the carbon module
  //
  const carbon = lib.createCarbonModule({
    ...services,
    countryOfOrigin: 'EN',
    locations: carbonLocations,
  })

  app.get(
    '/carbon/count',
    wrapper((req) => carbon.getCarbon())
  )

  //
  // Setup the schedule module
  //
  const schedule = lib.createScheduleModule({
    ...services,
    organiser: { name: 'Evil Corp', email: 'support@example.com' },
  })

  app.get<{ session_id: string }>(
    '/schedule/ics/:session_id',
    wrapper(async (req) => {
      const token = await getToken(req)
      return schedule.generateIcs(token, req.params.session_id)
    })
  )
  app.get(
    '/schedule/sessions',
    wrapper(async (req) => {
      const token = await getToken(req)
      return schedule.getSessions(token)
    })
  )
  app.get(
    '/schedule/settings',
    wrapper(() => schedule.getSettings())
  )
  app.get(
    '/schedule/slots',
    wrapper(() => schedule.getSlots())
  )
  app.get(
    '/schedule/speakers',
    wrapper(() => schedule.getSpeakers())
  )
  app.get(
    '/schedule/themes',
    wrapper(() => schedule.getThemes())
  )
  app.get(
    '/schedule/tracks',
    wrapper(() => schedule.getTracks())
  )
  app.get(
    '/schedule/types',
    wrapper(() => schedule.getTypes())
  )

  //
  // Start the express server
  //
  app.listen(3000, () => {
    console.log('Listening on http://localhost:3000')
  })
}

//
// Run the entrypoint and make errors exit the process
//
main().catch((error) => {
  console.error(error)
  process.exit(1)
})
