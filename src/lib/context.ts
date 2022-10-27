import { DeconfConfig } from './config.js'
import { DeconfEnv } from './env.js'
import { ResourcesMap } from './resources.js'

import { EmailService } from './email-service.js'
import { I18nService } from './i18n-service.js'
import { JwtService } from './jwt-service.js'
import { KeyValueService } from '../key-value/key-value-service.js'
import { PostgresService } from '../database/postgres-service.js'
import { S3Service } from './s3-service.js'
import { SemaphoreService } from './semaphore-service.js'
import { SocketService } from './socket-service.js'
import { UrlService } from './url-service.js'

import { ConferenceRepository } from '../conference/conference-repository.js'
import { AttendanceRepository } from '../attendance/attendance-repository.js'
import { CarbonRepository } from '../carbon/carbon-repository.js'
import { MetricsRepository } from '../metrics/metrics-repository.js'
import { RegistrationRepository } from '../registration/registration-repository.js'
import { InterpreterRepository } from '../interpret/interpreter-repository.js'
import { ContentRepository } from '../content/content-repository.js'

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
  contentRepo: Readonly<ContentRepository>
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
