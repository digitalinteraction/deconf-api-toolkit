import path from 'path'
import { loadResources } from '../resources'

describe('loadResources', () => {
  it('should load all the files into a map', async () => {
    const file = path.join(__dirname, '../../test-lib/test-resources')

    const result = await loadResources(file)
    const helloFile = result.get('folder/hello.txt')

    expect(Array.from(result.keys())).toEqual(['folder/hello.txt'])
    expect(helloFile?.toString('utf8')).toEqual('Hello, World!\n')
  })
})
