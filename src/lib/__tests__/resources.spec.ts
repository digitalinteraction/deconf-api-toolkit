import path from 'path'
import { loadResources } from '../resources.js'

describe('loadResources', () => {
  it('should load all the files into a map', async () => {
    const file = new URL('../../test-lib/test-resources', import.meta.url)

    const result = await loadResources(file.pathname)
    const helloFile = result.get('folder/hello.txt')

    expect(Array.from(result.keys())).toEqual(['folder/hello.txt'])
    expect(helloFile?.toString('utf8')).toEqual('Hello, World!\n')
  })
})
