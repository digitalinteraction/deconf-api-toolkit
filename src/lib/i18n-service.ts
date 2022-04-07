import fs from 'fs/promises'
import path from 'path'
import Yaml from 'yaml'
import dot from 'dot-prop'
import mustache from 'mustache'
import { ResourcesMap } from './resources'

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

export function loadI18nLocales(
  resources: ResourcesMap,
  locales: string[]
): I18nDictionary {
  const result: Record<string, unknown> = {}

  for (const locale of locales) {
    const key = `i18n/${locale}.yml`

    const raw = resources.get(key)?.toString('utf8')
    if (!raw) throw new Error(`I18n: "${key}" not found`)
    result[locale] = Yaml.parse(raw)
  }

  return result
}

export function localise(
  locale: string,
  obj: Record<string, string | undefined>,
  fallback: string
): string {
  return obj[locale] ?? obj.en ?? fallback
}

export class I18nService {
  #locales: I18nDictionary

  static findMissingKeys<T extends I18nDictionary>(locales: T) {
    const globalKeyset = new Set<string>()

    // For each locale, get it's keys and update the global keyset
    const localeKeys: Record<keyof T, string[]> = {} as any
    for (const locale in locales) {
      localeKeys[locale] = getI18nKeys(dot.get(locales, locale))
      for (const key of localeKeys[locale]) {
        globalKeyset.add(key)
      }
    }

    // For each locale, work out which keys are missing
    const allKeys = Array.from(globalKeyset)
    const missing: Record<keyof T, string[]> = {} as any
    for (const locale in locales) {
      const keys = new Set(localeKeys[locale])
      missing[locale] = allKeys.filter((k) => !keys.has(k))
    }
    return missing
  }

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
