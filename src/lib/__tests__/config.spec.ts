import { DeconfConfigStruct, loadConfig } from '../config.js'

describe('loadConfig', () => {
  it('should load and validate a config file', async () => {
    const file = new URL('../../test-lib/test-config.json', import.meta.url)
    const config = await loadConfig(file.pathname, DeconfConfigStruct)

    expect(config).toBeDefined()
  })
})
