import { jest } from '@jest/globals'
import { AttendanceRepository } from '../attendance/attendance-repository.js'
import { CarbonRepository } from '../carbon/carbon-repository.js'
import { ConferenceRepository } from '../conference/conference-repository.js'
import { ContentRepository } from '../content/content-repository.js'
import { MigrateRepository } from '../database/migrate-repository.js'
import { MigrateService } from '../database/migrate-service.js'
import {
  PostgresService,
  PostgresClient,
} from '../database/postgres-service.js'
import { InterpreterRepository } from '../interpret/interpreter-repository.js'
import { EmailService } from '../lib/email-service.js'
import { I18nService } from '../lib/i18n-service.js'
import { JwtService } from '../lib/jwt-service.js'
import { KeyValueService } from '../key-value/key-value-service.js'
import { S3Service } from '../lib/s3-service.js'
import { SemaphoreService } from '../lib/semaphore-service.js'
import { SocketService } from '../lib/socket-service.js'
import { UrlService } from '../lib/url-service.js'
import { MetricsRepository } from '../metrics/metrics-repository.js'
import { RegistrationRepository } from '../registration/registration-repository.js'

const emptyMock = () => jest.fn<any>()

//
// Attendance
//

export function mockAttendanceRepository(): Readonly<AttendanceRepository> {
  return {
    attend: emptyMock(),
    unattend: emptyMock(),
    getSessionAttendance: emptyMock(),
    getUserAttendance: emptyMock(),
  }
}

//
// Carbon
//

export function mockCarbonRepository(): Readonly<CarbonRepository> {
  return {
    getCountryCount: emptyMock(),
  }
}

//
// Conference
//

export function mockConferenceRepository(): Readonly<ConferenceRepository> {
  return {
    getSlots: emptyMock(),
    getSessions: emptyMock(),
    findSession: emptyMock(),
    getTracks: emptyMock(),
    getThemes: emptyMock(),
    getSpeakers: emptyMock(),
    getTypes: emptyMock(),
    getSettings: emptyMock(),
    getInterpreters: emptyMock(),
    findInterpreter: emptyMock(),
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
    release: emptyMock(),
    sql: emptyMock(),
  }
}

export function mockPostgresService(): Readonly<PostgresService> &
  PostgresServiceExtras {
  const mockClient = mockPostgresClient()
  return {
    getClient: emptyMock(async () => mockClient),
    close: emptyMock(),
    run: emptyMock((block) => block(mockClient)),
    mockClient,
    mockSql: mockClient.sql as any,
    checkHealth: emptyMock(),
  }
}

export function mockMigrateService(): Readonly<MigrateService> {
  return {
    runMigrations: emptyMock(),
  }
}

export function mockMigrateRepository(): Readonly<MigrateRepository> {
  return {
    getTables: emptyMock(),
    createMigrationsTable: emptyMock(),
    getPreviousMigrations: emptyMock(),
    runMigration: emptyMock(),
  }
}

//
// Registration
//
export function mockRegistrationRepository(): Readonly<RegistrationRepository> {
  return {
    getRegistrations: emptyMock(),
    getVerifiedRegistration: emptyMock(),
    register: emptyMock(),
    unregister: emptyMock(),
    verifyRegistration: emptyMock(),
  }
}

//
// Metrics
//
export function mockMetricsRepository(): Readonly<MetricsRepository> {
  return {
    trackEvent: emptyMock(),
  }
}

//
// Library
//
interface EmailExtras {
  outbox: Array<{ to: string; subject: string }>
}

export function mockEmailService(): Readonly<EmailService & EmailExtras> {
  const outbox: EmailExtras['outbox'] = []
  return {
    outbox,
    sendEmail: emptyMock(async (to, subject) => {
      outbox.push({ to, subject })
    }),
    sendTransactional: emptyMock(async (to, subject) => {
      outbox.push({ to, subject })
    }),
  }
}

export function mockI18nService(): Readonly<I18nService> {
  return {
    translate: emptyMock(),
  }
}

export function mockJwtService(): Readonly<JwtService> {
  return {
    signToken: emptyMock(),
    verifyToken: emptyMock(),
    getRequestAuth: emptyMock(),
    getSocketAuth: emptyMock(),
  }
}

export function mockUrlService(): Readonly<UrlService> {
  return {
    getClientLoginLink: emptyMock(),
    getSessionLink: emptyMock(),
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
    retrieve: emptyMock(async (key) => data.get(key) ?? null),
    put: emptyMock(async (key, value) => {
      data.set(key, value)
    }),
    checkHealth: emptyMock(),
    setExpiry: emptyMock(async (key, length) => {
      expirys.set(key, length)
    }),
    delete: emptyMock(async (key) => {
      data.delete(key)
    }),
    close: emptyMock(),
    data,
    expirys,
  }
}

export function mockSocketService(): Readonly<SocketService> {
  return {
    emitToEveryone: emptyMock(),
    emitTo: emptyMock(),
    joinRoom: emptyMock(),
    leaveRoom: emptyMock(),
    sendError: emptyMock(),
    getRoomsOfSocket: emptyMock(),
    getSocketsInRoom: emptyMock(),
  }
}

export function mockSemaphore(): Readonly<SemaphoreService> {
  return {
    aquire: emptyMock(),
    hasLock: emptyMock(),
    release: emptyMock(),
  }
}

export function mockS3Service(): Readonly<S3Service> {
  return {
    uploadFile: emptyMock(),
  }
}

//
// Interpretation
//

export function mockInterpreterRepository(): Readonly<InterpreterRepository> {
  return {
    prepInterpreter: emptyMock(),
  }
}

//
// Content
//
export function mockContentRepository(): Readonly<ContentRepository> {
  return {
    validateRemote: emptyMock(async () => true),
    updateLocalRepo: emptyMock(),
    cloneRepo: emptyMock(),
    clearDirectory: emptyMock(),
    makeTempDir: emptyMock(async () => 'test/fixtures'),
  }
}
