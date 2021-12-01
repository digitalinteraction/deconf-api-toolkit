import fs from 'fs/promises'
import { object, string, Describe, create, array, Struct } from 'superstruct'
import { DeconfConfig } from '@openlab/deconf-shared'
import createDebug from 'debug'

const debug = createDebug('deconf:lib:config')

// function jsonDate() {
//   return coerce(date(), string(), (value) => new Date(value))
// }

export const DeconfConfigStruct: Describe<DeconfConfig> = object({
  admins: array(
    object({
      email: string(),
    })
  ),
  mail: object({
    fromEmail: string(),
    replyToEmail: string(),
  }),
  organiser: object({
    name: string(),
    email: string(),
  }),
  carbon: object({
    originCountry: string(),
  }),
})

/** Load a json file and validate against a structure */
export async function loadConfig<T extends unknown>(
  path: string,
  struct: Struct<T>
): Promise<T> {
  debug('loadConfig %o', path)
  const rawConfig = JSON.parse(await fs.readFile(path, 'utf8'))

  const config = create(rawConfig, struct)

  return Object.freeze(config)
}

export function createTestingDeconfConfig(): DeconfConfig {
  return {
    admins: [{ email: 'geoff@example.com' }],
    mail: {
      fromEmail: 'noreply@example.com',
      replyToEmail: 'support@example.com',
    },
    organiser: {
      name: 'Open Lab',
      email: 'support@example.com',
    },
    carbon: {
      originCountry: 'GB',
    },
  }
}
