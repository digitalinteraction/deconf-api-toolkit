import { AttendanceRepository } from '../attendance/attendance-repository'
import { CarbonRepository } from '../carbon/carbon-repository'
import { ConferenceRepository } from '../conference/conference-repository'
import { ContentRepository } from '../content/content-repository'
import { MigrateRepository } from '../database/migrate-repository'
import { MigrateService } from '../database/migrate-service'
import { PostgresService, PostgresClient } from '../database/postgres-service'
import { InterpreterRepository } from '../interpret/interpreter-repository'
import { EmailService } from '../lib/email-service'
import { I18nService } from '../lib/i18n-service'
import { JwtService } from '../lib/jwt-service'
import { KeyValueService } from '../lib/key-value-service'
import { S3Service } from '../lib/s3-service'
import { SemaphoreService } from '../lib/semaphore-service'
import { SocketService } from '../lib/socket-service'
import { UrlService } from '../lib/url-service'
import { MetricsRepository } from '../metrics/metrics-repository'
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
// Database
//

interface PostgresServiceExtras {
  mockClient: PostgresClient
  mockSql: jest.Mock
}

export function mockPostgresClient(): Readonly<PostgresClient> {
  return {
    release: jest.fn(),
    sql: jest.fn(),
  }
}

export function mockPostgresService(): Readonly<PostgresService> &
  PostgresServiceExtras {
  const mockClient = mockPostgresClient()
  return {
    getClient: jest.fn(async () => mockClient),
    close: jest.fn(),
    run: jest.fn((block) => block(mockClient)),
    mockClient,
    mockSql: mockClient.sql as any,
  }
}

export function mockMigrateService(): Readonly<MigrateService> {
  return {
    runMigrations: jest.fn(),
  }
}

export function mockMigrateRepository(): Readonly<MigrateRepository> {
  return {
    getTables: jest.fn(),
    createMigrationsTable: jest.fn(),
    getPreviousMigrations: jest.fn(),
    runMigration: jest.fn(),
  }
}

//
// Registration
//
export function mockRegistrationRepository(): Readonly<RegistrationRepository> {
  return {
    getRegistrations: jest.fn(),
    getVerifiedRegistration: jest.fn(),
    register: jest.fn(),
    unregister: jest.fn(),
    verifyRegistration: jest.fn(),
  }
}

//
// Metrics
//
export function mockMetricsRepository(): Readonly<MetricsRepository> {
  return {
    trackEvent: jest.fn(),
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
    verifyToken: jest.fn(),
    getRequestAuth: jest.fn(),
    getSocketAuth: jest.fn(),
  }
}

export function mockUrlService(): Readonly<UrlService> {
  return {
    getClientLoginLink: jest.fn(),
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
    put: jest.fn(async (key, value) => {
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

export function mockSocketService(): Readonly<SocketService> {
  return {
    emitToEveryone: jest.fn(),
    emitTo: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    sendError: jest.fn(),
    getRoomsOfSocket: jest.fn(),
    getSocketsInRoom: jest.fn(),
  }
}

export function mockSemaphore(): Readonly<SemaphoreService> {
  return {
    aquire: jest.fn(),
    hasLock: jest.fn(),
    release: jest.fn(),
  }
}

export function mockS3Service(): Readonly<S3Service> {
  return {
    uploadFile: jest.fn(),
  }
}

//
// Interpretation
//

export function mockInterpreterRepository(): Readonly<InterpreterRepository> {
  return {
    prepInterpreter: jest.fn(),
  }
}

//
// Content
//
export function mockContentRepository(): Readonly<ContentRepository> {
  return {
    validateRemote: jest.fn(async () => true),
    updateLocalRepo: jest.fn(),
    cloneRepo: jest.fn(),
    clearDirectory: jest.fn(),
    makeTempDir: jest.fn(async () => 'test/fixtures'),
  }
}
