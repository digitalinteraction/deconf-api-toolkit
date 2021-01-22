import {
  createI18nService,
  loadLocales,
  getKeys,
  readYaml,
  assertLocales,
} from '../i18n-service'

import { mocked } from 'ts-jest/utils'
import fse = require('fs-extra')

jest.mock('fs-extra')

describe('readYaml', () => {
  it('should read the file', async () => {
    mocked<any>(fse.readFile).mockResolvedValue('some: value')

    await readYaml('root-dir', 'en')

    expect(fse.readFile).toBeCalledWith('root-dir/en.yml', 'utf8')
  })
  it('should parse the yaml contents', async () => {
    mocked<any>(fse.readFile).mockResolvedValue('some: value')

    const result = await readYaml('root-dir', 'en')

    expect(result).toEqual({
      some: 'value',
    })
  })
})

describe('loadLocales', () => {
  it('should list files in the locale directory', async () => {
    mocked<any>(fse.readdir).mockResolvedValue(['en.yml', 'fr.yml'])
    mocked<any>(fse.readFile).mockResolvedValue('key: "value"')

    await loadLocales('testdir')

    expect(fse.readdir).toBeCalledWith('testdir')
  })
  it('should compose an object of loaded yaml locales', async () => {
    mocked<any>(fse.readdir).mockResolvedValue(['en.yml', 'fr.yml', 'bad.json'])
    mocked<any>(fse.readFile).mockResolvedValue('key: "value"')

    const locales = await loadLocales('testdir')

    expect(locales).toEqual({
      en: { key: 'value' },
      fr: { key: 'value' },
    })
  })
})

describe('getKeys', () => {
  it('should return an array of all nested keys', () => {
    const keys = getKeys({
      timestamp: '001',
      geoff: {
        name: 'Geoff',
        age: 42,
      },
    })

    expect(keys).toContain('timestamp')
    expect(keys).toContain('geoff.name')
    expect(keys).toContain('geoff.age')
  })
})

describe('assertLocales', () => {
  it('should log missing keys', () => {
    const locales = {
      en: { object: { key: '' } },
      fr: {},
    }

    const log = jest.fn()

    assertLocales(locales, false, log)

    expect(log).toBeCalledTimes(1)
    expect(log).toBeCalledWith(expect.stringContaining('missing fr key'))
    expect(log).toBeCalledWith(expect.stringContaining('object.key'))
  })
})

describe('createI18nService', () => {
  async function setup() {
    const service = await createI18nService({
      en: {
        test: {
          simple: 'Hello, world!',
          substituted: 'Hello, {{ name }}!',
        },
      },
      fr: {
        test: {
          simple: 'Bonjour le monde!',
        },
      },
      es: {},
    })
    return { service }
  }

  describe('#translate', () => {
    it('should perform simple translations', async () => {
      const { service } = await setup()

      const result = service.translate('en', 'test.simple')
      expect(result).toEqual('Hello, world!')
    })

    it('should perform simple french translations', async () => {
      const { service } = await setup()

      const result = service.translate('fr', 'test.simple')
      expect(result).toEqual('Bonjour le monde!')
    })

    it('should fail for unknown locales', async () => {
      const { service } = await setup()

      const call = () => service.translate('ru', 'test.simple')
      expect(call).toThrow(/Unknown locale/)
    })

    it('should fallback to english', async () => {
      const { service } = await setup()

      const result = service.translate('es', 'test.simple')
      expect(result).toEqual('Hello, world!')
    })

    it('should perform substitutions', async () => {
      const { service } = await setup()

      const result = service.translate('en', 'test.substituted', {
        name: 'Geoff',
      })

      expect(result).toEqual('Hello, Geoff!')
    })
  })
})
