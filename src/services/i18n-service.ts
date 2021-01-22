import fse = require('fs-extra')
import path = require('path')
import Yaml = require('yaml')
import dot = require('dot-prop')
import mustache = require('mustache')

export interface I18nService {
  translate(country: string, key: string, variables?: any): string
}

export type I18nDictionary = Record<string, any>

export async function readYaml(directory: string, country: string) {
  const data = await fse.readFile(
    path.join(directory, `${country}.yml`),
    'utf8'
  )

  return Yaml.parse(data)
}

export async function loadLocales(directory: string) {
  const directories = await fse.readdir(directory)

  const locales = directories
    .filter((filename) => filename.endsWith('.yml'))
    .map((filename) => filename.replace('.yml', ''))

  const output: Record<string, any> = {}

  for (const locale of locales) {
    output[locale] = await readYaml(directory, locale)
  }

  return output
}

export function getKeys(object: any, segments: string[] = []) {
  const keys: string[] = []

  for (const [key, value] of Object.entries(object)) {
    const newSegments = segments.concat([key])

    if (typeof value === 'object') {
      keys.push(...getKeys(value, newSegments))
    } else {
      keys.push(newSegments.join('.'))
    }
  }

  return keys
}

export function assertLocales<T extends I18nDictionary>(
  locales: T,
  throws: boolean,
  output = console.log
) {
  // const requiredKeys = getKeys(locales.en)
  const joiner = '\n - '

  // Emit a warning or throw an error depending on 'throws' variable
  const errorOrWarn = (msg: string) => {
    if (throws) throw new Error(msg)
    else output('WARNING: ' + msg)
  }

  // A set of all known locale keys
  const keyset = new Set<string>()

  // A record of locale to their implemented keys
  const localeKeys: Record<keyof T, string[]> = {} as any

  // For each locale, get its keys and update the global keyset
  for (const locale in locales) {
    const keys = getKeys(dot.get(locales, locale))
    keys.forEach((k) => keyset.add(k))
    localeKeys[locale] = keys
  }

  // Get the global keyset as an array
  const allKeys = Array.from(keyset)

  // For each locale, find keys that it hasn't implemented
  for (const locale in localeKeys) {
    const keys = new Set(localeKeys[locale])

    // If there are missing action that
    const missing = allKeys.filter((k) => !keys.has(k))
    if (missing.length > 0) {
      errorOrWarn(`missing ${locale} keys:` + joiner + missing.join(joiner))
    }
  }
}

export async function createI18nService(
  locales: I18nDictionary
): Promise<I18nService> {
  // Ensure all locales all have the same keys
  // assertLocales(locales, false)

  const data: Record<string, any> = locales

  return {
    translate(country, key, values) {
      if (!locales[country]) throw new Error(`Unknown locale '${country}'`)

      const tpl: string | undefined = dot.get(
        data[country],
        key,
        dot.get(data.en, key)
      )

      if (!tpl) {
        throw new Error(`Unknown translation key "${key}"`)
      }

      return mustache.render(tpl, values)
    },
  }
}
