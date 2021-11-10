import path from 'path'
import fs from 'fs/promises'

import MarkdownIt from 'markdown-it'
import createDebug from 'debug'

import { DeconfBaseContext } from '../module'
import { ContentRepository } from './content-repository'

const debug = createDebug('deconf:content:service')

export interface ProcessRepoOptions {
  remote: string
  branch: string
  reuseDirectory?: string
  contentKeys: string[]
  languages: string[]
}

export interface ProcessRepoCallback {
  (): AsyncGenerator<unknown, unknown, AsyncGenerator>
}

type Context = Pick<DeconfBaseContext, 'store'> & {
  contentRepo: Readonly<ContentRepository>
}

export class ContentService {
  get #contentRepo() {
    return this.#context.contentRepo
  }
  get #store() {
    return this.#context.store
  }

  #context: Context

  constructor(context: Context) {
    this.#context = context
  }

  async processRepository(
    options: ProcessRepoOptions,
    callback?: ProcessRepoCallback
  ) {
    // Work out what directory the repo is in / should be in
    const directory =
      options.reuseDirectory ??
      (await this.#contentRepo.makeTempDir('content_'))

    try {
      if (!options.reuseDirectory) {
        const isValid = await this.#contentRepo.validateRemote(options.remote)
        if (!isValid) throw new Error('Invalid git remote')

        await this.#contentRepo.cloneRepo(
          directory,
          options.remote,
          options.branch
        )
      } else {
        // If reusing a directory, ensure the branch is correct
        await this.#contentRepo.updateLocalRepo(
          directory,
          options.remote,
          options.branch
        )
      }

      // Allow the caller to validate and process the directory
      const custom = callback?.()
      if (custom) await custom.next()

      // Create an generator to process the content and run markdown validation
      const it = this.contentIterator(
        path.join(directory, 'content'),
        options.contentKeys,
        options.languages
      )
      await it.next()

      // Once all markdown is validated, run the generator again to put html into the store
      await it.next()

      // Allow the caller to save
      if (custom) await custom.next()
    } finally {
      // Clear the temporary directory
      if (!options.reuseDirectory) {
        await this.#contentRepo.clearDirectory(directory)
      }
    }
  }

  async *contentIterator(
    directory: string,
    contentKeys: string[],
    languages: string[]
  ) {
    const content: Array<{ key: string; files: Record<string, string> }> = []

    debug('contentInterator validating %o', contentKeys)
    for (const key of contentKeys) {
      const files = await this.validateContent(
        path.join(directory, key),
        languages
      )
      content.push({ key, files })
    }

    // Let all content be validated together, before putting in the store
    yield content

    debug('contentInterator storing %o', contentKeys)
    for (const { key, files } of content) {
      await this.#store.put(`content.${key}`, files)
    }
  }

  async validateContent<T extends string>(directory: string, languages: T[]) {
    debug('validateContent directory=%o langs=%o', directory, languages)
    try {
      const output: Record<T, string> = {} as any

      for (const locale of languages) {
        const data = await fs.readFile(
          path.join(directory, `${locale}.md`),
          'utf8'
        )
        output[locale] = this.processMarkdown(data)
      }

      return output
    } catch (error) {
      console.error('Error reading content', error)
      throw error
    }
  }

  /** Take markdown in a string, process %custom_tags% and return a new string */
  processMarkdown(markdown: string) {
    const lines = markdown
      .split('\n')
      .map((line) =>
        line.replace(/^%+(.+)%+$/, (match, id) => `<div id="${id}"></div>`)
      )

    const md = new MarkdownIt({
      html: true,
    })

    return md.render(lines.join('\n'))
  }
}
