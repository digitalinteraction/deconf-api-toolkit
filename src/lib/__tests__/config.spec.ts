import path from 'path'
import { DeconfConfigStruct, loadConfig } from '../config'

describe('loadConfig', () => {
  it('should load and validate a config file', async () => {
    const file = path.join(__dirname, '../../test-lib/test-config.json')
    const config = await loadConfig(file, DeconfConfigStruct)

    expect(config).toBeDefined()
  })
})
