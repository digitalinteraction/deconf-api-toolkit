import { MockedObject } from 'ts-jest/dist/utils/testing'

import { AttendanceRepository } from '../attendance/attendance-repository'
import { CarbonRepository } from '../carbon/carbon-repository'
import { ConferenceRepository } from '../conference/conference-repository'
import { MigrateService } from '../database/migrate-service'
import { PostgresService, PostgresClient } from '../database/postgres-service'
import { EmailService } from '../lib/email-service'
import { I18nService } from '../lib/i18n-service'
import { JwtService } from '../lib/jwt-service'
import { KeyValueService } from '../lib/key-value-service'
import { UrlService } from '../lib/url-service'
import { RegistrationRepository } from '../registration/registration-repository'

//
// Attendance
//

export function mockAttendanceRepository(): Readonly<AttendanceRepository> {
  return {
    attend: jest.fn(),
    unattend: jest.fn(),
    getSessionAttendance: jest.fn(),
    getUserAttendance: jest.fn(),
  }
}

//
// Carbon
//

export function mockCarbonRepository(): Readonly<CarbonRepository> {
  return {
    getCountryCount: jest.fn(),
  }
}

//
// Conference
//

export function mockConferenceRepository(): Readonly<ConferenceRepository> {
  return {
    getSlots: jest.fn(),
    getSessions: jest.fn(),
    findSession: jest.fn(),
    getTracks: jest.fn(),
    getThemes: jest.fn(),
    getSpeakers: jest.fn(),
    getTypes: jest.fn(),
    getSettings: jest.fn(),
    getInterpreters: jest.fn(),
    findInterpreter: jest.fn(),
  }
}

//
// Postgres
//

interface PostgresExtras {
  mockClient: PostgresClient
}

export function mockPostgresClient() {
  return {
    release: jest.fn(),
    sql: jest.fn(),
  }
}

export function mockPostgresService(): Readonly<PostgresService> &
  PostgresExtras {
  const mockClient = mockPostgresClient()
  return {
    getClient: jest.fn(),
    close: jest.fn(),
    run: jest.fn(),
    mockClient,
  }
}

export function mockMigrateService(): Readonly<MigrateService> {
  return {
    runAll: jest.fn(),
    runMigrations: jest.fn(),
  }
}

//
// Registration
//
export function mockRegistrationRepository(): Readonly<RegistrationRepository> {
  return {
    findRegistrations: jest.fn(),
    getVerifiedRegistration: jest.fn(),
    register: jest.fn(),
    unregister: jest.fn(),
    verifyRegistration: jest.fn(),
  }
}

//
// Library
//
interface EmailExtras {
  outbox: Array<{ to: string; subject: string; html: string }>
}

export function mockEmailService(): Readonly<EmailService & EmailExtras> {
  const outbox: EmailExtras['outbox'] = []
  return {
    outbox,
    sendEmail: jest.fn(async (to: string, subject: string, html: string) => {
      outbox.push({ to, subject, html })
    }),
  }
}

export function mockI18nService(): Readonly<I18nService> {
  return {
    translate: jest.fn(),
  }
}

export function mockJwtService(): Readonly<JwtService> {
  return {
    signToken: jest.fn(),
    verifyAuthToken: jest.fn(),
    verifyEmailLoginToken: jest.fn(),
    fromSocketId: jest.fn(),
    fromRequestHeaders: jest.fn(),
  }
}

export function mockUrlService(): Readonly<UrlService> {
  return {
    getSessionLink: jest.fn(),
  }
}

interface StoreExtras {
  data: Map<string, any>
  expirys: Map<string, number>
}
export function mockKeyValueStore(): Readonly<KeyValueService & StoreExtras> {
  const data = new Map<string, any>()
  const expirys = new Map<string, number>()
  return {
    retrieve: jest.fn(async (key) => data.get(key) ?? null),
    store: jest.fn(async (key, value) => {
      data.set(key, value)
    }),
    checkHealth: jest.fn(),
    setExpiry: jest.fn(async (key, length) => {
      expirys.set(key, length)
    }),
    delete: jest.fn(async (key) => {
      data.delete(key)
    }),
    close: jest.fn(),
    data,
    expirys,
  }
}