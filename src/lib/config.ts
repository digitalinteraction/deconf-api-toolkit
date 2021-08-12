import fs from 'fs/promises'
import { object, string, Infer, create, array, Struct } from 'superstruct'

// function jsonDate() {
//   return coerce(date(), string(), (value) => new Date(value))
// }

export const DeconfConfigStruct = object({
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

export type DeconfConfig = Infer<typeof DeconfConfigStruct>

export async function loadConfig<T extends Struct<DeconfConfig>>(
  path: string,
  struct: T
) {
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
