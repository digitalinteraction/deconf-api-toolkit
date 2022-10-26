import { createMemoryStore } from '../../module'
import { PretalxService } from '../pretalx-service'

function setup() {
  const store = createMemoryStore()
  const env = { PRETALX_API_TOKEN: 'top_secret' }
  const config = {
    eventSlug: 'test-event',
    englishKeys: ['en', 'moz-en'],
    pageSize: 50,
  }
  const service = new PretalxService({ store, env, config })
  return { store, env, config, service }
}

describe('PretalxService', () => {
  describe('#getPaginator', () => {
    it('should not transform the body', async () => {
      const { service } = setup()
      const paginator = service.getPaginator()
      const response: any = { body: { results: 'test_results' } }
      const result = paginator.pagination?.transform?.(response)
      expect(result).toEqual('test_results')
    })
    it('should paginate with the "next" link', async () => {
      const { service } = setup()
      const paginator = service.getPaginator()
      const response: any = {
        requestUrl: 'https://example.com',
        body: { next: 'https://example.com?page=2' },
      }

      const result: any = paginator?.pagination?.paginate?.(response, [], [])

      expect(result?.searchParams?.get('page')).toEqual('2')
    })
    it('should not paginate when no next is passed', async () => {
      const { service } = setup()
      const paginator = service.getPaginator()
      const response: any = {
        requestUrl: 'https://example.com',
      }

      const result = paginator?.pagination?.paginate?.(response, [], [])

      expect(result).toEqual(false)
    })
  })

  describe('#baseSearchParams', () => {
    it('should include the "limit" parameter', async () => {
      const { service } = setup()

      expect(service.baseSearchParams).toEqual({ limit: 50 })
    })
  })

  describe('#findAnswer', () => {
    it('should return the answer matching the question', async () => {
      const { service } = setup()
      const responses: any[] = [{ question: { id: 1 }, answer: 'answer-a' }]

      expect(service.findAnswer(1, responses)).toEqual('answer-a')
    })
    it('should return return null for no match', async () => {
      const { service } = setup()
      expect(service.findAnswer(1, [])).toEqual(null)
    })
  })

  describe('#getSlotId', () => {
    it('should generate an id based on start/end time', async () => {
      const { service } = setup()
      const slot: any = {
        start: new Date('2022-03-09T16:00:00+01:00'),
        end: new Date('2022-03-09T17:00:00+01:00'),
      }
      const result = service.getSlotId(slot)

      expect(result).toEqual('1646838000000__1646841600000')
    })
    it('should return undefined for invalid dates', async () => {
      const { service } = setup()
      const slot: any = {
        start: new Date('not_a_date'),
        end: new Date('2022-03-09T17:00:00+01:00'),
      }
      const result = service.getSlotId(slot)

      expect(result).toEqual(undefined)
    })
    it('should return undefined if a date is missing', async () => {
      const { service } = setup()
      const slot: any = {
        start: new Date('2022-03-09T16:00:00+01:00'),
        end: undefined,
      }
      const result = service.getSlotId(slot)

      expect(result).toEqual(undefined)
    })
    it('should return undefined if no date passed', async () => {
      const { service } = setup()
      expect(service.getSlotId(undefined)).toEqual(undefined)
    })
  })

  describe('#isUrl', () => {
    it('should return true for valid URLs', async () => {
      const { service } = setup()
      expect(service.isUrl('https://example.com')).toEqual(true)
    })
  })

  describe('#makeUnique', () => {
    it('should append an id if that code already exists', async () => {
      const { service } = setup()
      const first = service.makeUnique('code')
      const second = service.makeUnique('code')

      expect(first).toEqual('code-1')
      expect(second).toEqual('code-2')
    })
  })

  describe('#getIdFromTitle', () => {
    it('should generate an id', async () => {
      const { service } = setup()
      const result = service.getIdFromTitle({ en: 'My session' }, 'unknown')
      expect(result).toEqual('my-session')
    })
    it('should use the fallback if no title found', async () => {
      const { service } = setup()
      const result = service.getIdFromTitle({}, 'unknown')
      expect(result).toEqual('unknown')
    })
  })

  describe('#getSlug', () => {
    it('should generate a slug from a title', async () => {
      const { service } = setup()
      expect(service.getSlug(' My sEssion\t')).toEqual('my-session')
    })
    it('should generate a slug from a title', async () => {
      const { service } = setup()
      expect(service.getSlug('Gender, Tech & Intersectionality')).toEqual(
        'gender-tech-intersectionality'
      )
    })
    it('should generate a slug from a title', async () => {
      const { service } = setup()
      expect(service.getSlug('Skill Share / Lightning Talk')).toEqual(
        'skill-share-lightning-talk'
      )
    })
  })

  describe('#getDeconfSlots', () => {
    it('should deduplicate slots from sessions', async () => {
      const { service } = setup()

      const a = '2022-10-26T12:00:00.000Z'
      const b = '2022-10-26T13:00:00.000Z'
      const c = '2022-10-26T14:00:00.000Z'
      const submissions: any[] = [
        { slot: { start: a, end: b } },
        { slot: { start: a, end: b } },
        { slot: { start: b, end: c } },
      ]

      const result = service.getDeconfSlots(submissions)
      expect(result).toHaveLength(2)
      expect(result).toContainEqual(
        expect.objectContaining({
          start: new Date(a),
          end: new Date(b),
        })
      )
      expect(result).toContainEqual(
        expect.objectContaining({
          start: new Date(b),
          end: new Date(c),
        })
      )
    })
  })
})
