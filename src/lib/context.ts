import { DeconfConfig } from './config'
import { DeconfEnv } from './env'
import { ResourcesMap } from './resources'

import { EmailService } from './email-service'
import { I18nService } from './i18n-service'
import { JwtService } from './jwt-service'
import { KeyValueService } from '../key-value/key-value-service'
import { PostgresService } from '../database/postgres-service'
import { S3Service } from './s3-service'
import { SemaphoreService } from './semaphore-service'
import { SocketService } from './socket-service'
import { UrlService } from './url-service'

import { ConferenceRepository } from '../conference/conference-repository'
import { AttendanceRepository } from '../attendance/attendance-repository'
import { CarbonRepository } from '../carbon/carbon-repository'
import { MetricsRepository } from '../metrics/metrics-repository'
import { RegistrationRepository } from '../registration/registration-repository'
import { InterpreterRepository } from '../interpret/interpreter-repository'

export type DeconfBaseContext = {
  // Core library
  config: Readonly<DeconfConfig>
  env: Readonly<DeconfEnv>
  resources: ResourcesMap

  // Core services
  email: Readonly<EmailService>
  i18n: Readonly<I18nService>
  jwt: Readonly<JwtService>
  postgres: Readonly<PostgresService>
  semaphore: Readonly<SemaphoreService>
  sockets: Readonly<SocketService>
  store: Readonly<KeyValueService>
  url: Readonly<UrlService>
  s3: Readonly<S3Service>

  // Repositories
  attendanceRepo: Readonly<AttendanceRepository>
  carbonRepo: Readonly<CarbonRepository>
  conferenceRepo: Readonly<ConferenceRepository>
  metricsRepo: Readonly<MetricsRepository>
  registrationRepo: Readonly<RegistrationRepository>
  interpreterRepo: Readonly<InterpreterRepository>
}

// IDEA: Provide a super-class to reduce boilerplate code
// - I don't want to introduce inheritance though
// - protected fields mess up the generated interface
// - can't use es-private fields as subclass' don't get access
export class Contextual<Keys extends keyof DeconfBaseContext> {
  constructor(protected context: Pick<DeconfBaseContext, Keys>) {
    this.setup()
  }

  // Override in subclass to throw startup-time errors
  setup() {}
}
