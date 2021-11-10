import { mockContentRepository, mockKeyValueStore } from '../../test-lib/module'
import { ContentService } from '../content-service'

// NOTE:
// it is slightly hacky to use 'test/fixtures' as the directory because it
// relies on the name of the fixture 'content' being the same as the folder
// ContentService uses inside a repo 'content'

function setup() {
  const store = mockKeyValueStore()
  const contentRepo = mockContentRepository()
  const contentService = new ContentService({ store, contentRepo })
  return { store, contentRepo, contentService }
}

describe('ContentService', () => {
  describe('processRepository', () => {
    it('should clone the git repo', async () => {
      const { contentService, contentRepo } = setup()

      await contentService.processRepository({
        remote: 'git@github.com:username/repo.git',
        branch: 'main',
        contentKeys: ['about'],
        languages: ['en', 'fr', 'es', 'ar'],
      })

      expect(contentRepo.cloneRepo).toBeCalledWith(
        'test/fixtures',
        'git@github.com:username/repo.git',
        'main'
      )
    })
    it('should update a reused local repo', async () => {
      const { contentService, contentRepo } = setup()

      await contentService.processRepository({
        remote: 'git@github.com:username/repo.git',
        branch: 'main',
        contentKeys: ['about'],
        languages: ['en', 'fr', 'es', 'ar'],
        reuseDirectory: 'test/fixtures',
      })

      expect(contentRepo.updateLocalRepo).toBeCalledWith(
        'test/fixtures',
        'git@github.com:username/repo.git',
        'main'
      )
    })
    it('should put content into the store', async () => {
      const { contentService, store } = setup()
      let i = 0

      await contentService.processRepository({
        remote: 'git@github.com:username/repo.git',
        branch: 'main',
        contentKeys: ['about'],
        languages: ['en', 'fr', 'es', 'ar'],
        reuseDirectory: 'test/fixtures',
      })

      expect(store.put).toBeCalledWith('content.about', {
        en: expect.any(String),
        fr: expect.any(String),
        es: expect.any(String),
        ar: expect.any(String),
      })
    })
    it('should use the callback and yield it', async () => {
      const { contentService } = setup()
      let i = 0

      await contentService.processRepository(
        {
          remote: 'git@github.com:username/repo.git',
          branch: 'main',
          contentKeys: ['about'],
          languages: ['en', 'fr', 'es', 'ar'],
          reuseDirectory: 'test/fixtures',
        },
        async function* () {
          while (true) yield i++
        }
      )

      expect(i).toEqual(2) // The generate should be called and yield-ed
    })
  })

  describe('#contentIterator', () => {
    it('should validate all folders', async () => {
      const { contentService } = setup()

      const it = contentService.contentIterator(
        'test/fixtures/content',
        ['about'],
        ['en', 'fr', 'es', 'ar']
      )
      const result = await it.next()

      expect(result.value).toEqual([
        {
          key: expect.any(String),
          files: expect.any(Object),
        },
      ])
    })

    it('should put processed content into the store', async () => {
      const { contentService, store } = setup()

      const it = contentService.contentIterator(
        'test/fixtures/content',
        ['about'],
        ['en', 'fr', 'es', 'ar']
      )
      await it.next() // run setp 1 - validation
      await it.next() // run step 2 - store

      expect(store.put).toBeCalledWith('content.about', {
        en: expect.any(String),
        fr: expect.any(String),
        es: expect.any(String),
        ar: expect.any(String),
      })
    })
  })
  describe('#validateContent', () => {
    it('should read the files and parse them', async () => {
      const { contentService } = setup()

      const result = await contentService.validateContent(
        'test/fixtures/content/about',
        ['en', 'fr', 'es', 'ar']
      )

      expect(result).toEqual({
        en: expect.any(String),
        fr: expect.any(String),
        es: expect.any(String),
        ar: expect.any(String),
      })
    })
  })

  describe('#processMarkdown', () => {
    it('should convert markdown to HTML', async () => {
      const { contentService } = setup()

      const result = contentService.processMarkdown('Hello, World!').trim()

      expect(result).toEqual('<p>Hello, World!</p>')
    })
    it('should replace custom tags with divs', async () => {
      const { contentService } = setup()

      const result = contentService.processMarkdown('%featured_video%')

      expect(result).toEqual('<div id="featured_video"></div>')
    })
    it('should process multiple tags', async () => {
      const { contentService } = setup()

      const result = contentService.processMarkdown(
        '%featured_video%\n%featured_video%'
      )

      expect(result).toEqual(
        '<div id="featured_video"></div>\n<div id="featured_video"></div>'
      )
    })
  })
})
