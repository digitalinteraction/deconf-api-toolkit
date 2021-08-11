import fs from 'fs/promises'
import path from 'path'
import Yaml from 'yaml'
import dot from 'dot-prop'
import mustache from 'mustache'

export type I18nDictionary = Record<string, any>

async function readYaml(filename: string) {
  return Yaml.parse(await fs.readFile(filename, 'utf8'))
}

export function getI18nKeys(object: any, segments: string[] = []) {
  const keys: string[] = []

  for (const [key, value] of Object.entries(object)) {
    const newSegments = segments.concat([key])

    if (typeof value === 'object') {
      keys.push(...getI18nKeys(value, newSegments))
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
    const keys = getI18nKeys(dot.get(locales, locale))
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

export class I18nService {
  #locales: I18nDictionary

  static async loadLocales(directory: string) {
    const directories = await fs.readdir(directory)

    const locales = directories
      .filter((filename) => filename.endsWith('.yml'))
      .map((filename) => filename.replace('.yml', ''))

    const output: Record<string, any> = {}

    for (const locale of locales) {
      output[locale] = await readYaml(path.join(directory, `${locale}.yml`))
    }

    return output
  }

  constructor(locales: I18nDictionary) {
    this.#locales = locales
  }

  translate(country: string, key: string, variables?: any) {
    const localeStrings = this.#locales[country]
    if (!localeStrings) throw new Error(`Unknown locale '${country}'`)

    const tpl: string | undefined = dot.get(
      localeStrings,
      key,
      dot.get(this.#locales.en, key)
    )

    if (!tpl) {
      throw new Error(`Unknown translation key "${key}"`)
    }

    return mustache.render(tpl, variables)
  }
}
