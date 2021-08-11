import { JwtService } from './jwt-service'
import { DeconfConfig } from './config'
import { DeconfEnv } from './env'
import { EmailService } from './email-service'
import { I18nService } from './i18n-service'
import { KeyValueService } from './key-value-service'
import { PostgresService } from '../database/postgres-service'
// import { QueryService } from './query-service'
import { ResourcesMap } from './resources'

import { ConferenceRepository } from '../conference/conference-repository'
import { UrlService } from './url-service'

import { RegistrationRepository } from '../registration/registration-repository'
import { AttendanceRepository } from '../attendance/attendance-repository'
import { CarbonRepository } from '../carbon/carbon-repository'

export type DeconfBaseContext = {
  // Core library
  env: Readonly<DeconfEnv>
  config: Readonly<DeconfConfig>
  store: Readonly<KeyValueService>
  jwt: Readonly<JwtService>
  email: Readonly<EmailService>
  i18n: Readonly<I18nService>
  postgres: Readonly<PostgresService>
  url: Readonly<UrlService>
  resources: ResourcesMap

  // Repos
  registrationRepo: Readonly<RegistrationRepository>
  attendanceRepo: Readonly<AttendanceRepository>
  conferenceRepo: Readonly<ConferenceRepository>
  carbonRepo: Readonly<CarbonRepository>
}

// IDEA: Provide a super-class to reduce boilerplate code
// - I don't want to introduce inheritance though
export class Contextual<Keys extends keyof DeconfBaseContext> {
  constructor(protected context: Pick<DeconfBaseContext, Keys>) {
    this.setup()
  }

  // Override in subclass to throw startup-time errors
  setup() {}
}
