import path from 'path'
import express from 'express'
import dotenv from 'dotenv'

import {
  createEnv,
  loadConfig,
  DeconfConfigStruct,
  AttendanceRepository,
  PostgresService,
  CarbonRepository,
  createMemoryStore,
  MigrateService,
  DECONF_MIGRATIONS,
  AttendanceRoutes,
  ConferenceRepository,
  RegistrationRepository,
  CarbonRoutes,
  ConferenceRoutes,
  UrlService,
  RegistrationRoutes,
  EmailService,
  I18nService,
  JwtService,
  ApiError,
  loadResources,
  ConfigSettingsStruct,
  PretalxConfigStruct,
} from '../src/module'

import { MigrateRepository } from '../src/database/migrate-repository'
import { object, assign } from 'superstruct'

const AppConfigStruct = assign(
  DeconfConfigStruct,
  object({
    conference: ConfigSettingsStruct,
    pretalx: PretalxConfigStruct,
  })
)

function runMigrations(postgres: PostgresService) {
  return postgres.run(async (client) => {
    const migrateRepo = new MigrateRepository(client)
    const migrate = new MigrateService({ migrateRepo })
    migrate.runMigrations(DECONF_MIGRATIONS)
  })
}

function errorHandler(block: express.RequestHandler): express.RequestHandler {
  // A middleware to catch ApiErrors and handle them ...
  return async (req, res, next) => {
    try {
      await block(req, res, next)
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.status).send({
          message: error.message,
          codes: error.codes,
        })
      } else {
        console.error(error)
        res.status(500).send(error.message)
      }
    }
  }
}

async function main() {
  dotenv.config({
    path: path.join(__dirname, 'app.env'),
  })

  const env = createEnv()
  const config = await loadConfig(
    path.join(__dirname, 'app-config.json'),
    AppConfigStruct
  )
  const resources = await loadResources(path.join(__dirname, 'res'))
  const store = createMemoryStore()
  const postgres = new PostgresService({ env })
  const url = new UrlService({ env })
  const email = new EmailService({ env, config })
  const jwt = new JwtService({ env, store })

  const locales = await I18nService.loadLocales(path.join(__dirname, 'i18n'))
  const i18n = new I18nService(locales)

  const attendanceRepo = new AttendanceRepository({ postgres })
  const carbonRepo = new CarbonRepository({ postgres })
  const conferenceRepo = new ConferenceRepository({ store })
  const registrationRepo = new RegistrationRepository({ postgres })

  const baseContext = {
    env,
    config,
    resources,
    store,
    postgres,
    url,
    email,
    jwt,
    i18n,
    attendanceRepo,
    carbonRepo,
    conferenceRepo,
    registrationRepo,
  }

  console.log('Starting')
  const app = express()

  console.log('Running migrations')
  await runMigrations(postgres)

  app.get('/', (req, res) => {
    res.send({ message: 'ok' })
  })

  //
  // Add attendance routes
  //
  const attendanceRoutes = new AttendanceRoutes(baseContext)

  app.post(
    '/attend/:sessionId',
    errorHandler(async (req, res) => {
      const authToken = jwt.getRequestAuth(req.headers)
      await attendanceRoutes.attend(authToken, req.params.sessionId)
      res.send('ok')
    })
  )
  app.post(
    '/unattend/:sessionId',
    errorHandler(async (req, res) => {
      const authToken = jwt.getRequestAuth(req.headers)
      await attendanceRoutes.unattend(authToken, req.params.sessionId)
      res.send('ok')
    })
  )
  app.get(
    '/attendance/:sessionId',
    errorHandler(async (req, res) => {
      res.send(
        await attendanceRoutes.getSessionAttendance(
          jwt.getRequestAuth(req.headers),
          req.params.sessionId
        )
      )
    })
  )
  app.get(
    '/getUserAttendance',
    errorHandler(async (req, res) => {
      res.send({
        attendance: await attendanceRoutes.getUserAttendance(
          jwt.getRequestAuth(req.headers)
        ),
      })
    })
  )

  //
  // Add carbon routes
  //
  const carbonRoutes = new CarbonRoutes(baseContext)

  app.get(
    '/carbon',
    errorHandler(async (req, res) => {
      res.send(await carbonRoutes.getCarbon())
    })
  )

  //
  // Add registration routes
  //
  const registrationRoutes = new RegistrationRoutes({
    ...baseContext,
    mailer: {
      async sendLoginEmail(registration, token) {
        console.log(
          'Send login email \nregistration=%o\ntoken=%o',
          registration,
          token
        )
      },
      async sendVerifyEmail(registration, token) {
        console.log(
          'Send verify email \nregistration=%o\ntoken=%o',
          registration,
          token
        )
      },
    },
  })

  app.get(
    '/auth/me',
    errorHandler(async (req, res) => {
      const authToken = jwt.getRequestAuth(req.headers)
      return {
        registration: await registrationRoutes.getRegistration(authToken),
      }
    })
  )

  app.post(
    '/auth/login',
    errorHandler(async (req, res) => {
      await registrationRoutes.startEmailLogin(req.body.email)
      res.send('ok')
    })
  )

  app.get(
    '/auth/login/:token',
    errorHandler(async (req, res) => {
      const token = await registrationRoutes.finishEmailLogin(req.params.token)
      res.send({ token })
    })
  )

  app.post(
    '/auth/register',
    errorHandler(async (req, res) => {
      await registrationRoutes.startRegister(req.body)
      res.send('ok')
    })
  )

  app.get(
    '/auth/register/:token',
    errorHandler(async (req, res) => {
      const token = await registrationRoutes.finishRegister(req.params.token)
      res.send({ token })
    })
  )

  app.delete(
    '/auth/me',
    errorHandler(async (req, res) => {
      const authToken = jwt.getRequestAuth(req.headers)
      await registrationRoutes.unregister(authToken)
      res.send('ok')
    })
  )

  //
  // Add Conference routes
  //
  const conferenceRoutes = new ConferenceRoutes(baseContext)

  app.get(
    '/schedule/sessions',
    errorHandler(async (req, res) => {
      res.send(await conferenceRoutes.getSchedule())
    })
  )

  app.get(
    '/schedule/ics/:sessionId',
    errorHandler(async (req, res) => {
      const { sessionId } = req.params
      const authToken = jwt.getRequestAuth(req.headers)
      const locale = authToken?.user_lang ?? 'en'
      res.set('content-type', 'text/calendar')
      res.set('content-disposition', `attachment; filename="${sessionId}.ics`)
      res.send(await conferenceRoutes.generateIcs(locale, sessionId))
    })
  )

  app.get(
    '/schedule/:sessionId/links',
    errorHandler(async (req, res) => {
      const authToken = jwt.getRequestAuth(req.headers)
      res.send({
        links: await conferenceRoutes.getLinks(authToken, req.params.sessionId),
      })
    })
  )

  //
  // Run the server
  //
  app.listen(3000, () => {
    console.log('Listening on http://localhost:3000')
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
