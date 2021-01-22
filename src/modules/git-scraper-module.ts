import { Struct, StructError } from 'superstruct'

// A module to expose content-scraper logic to easily write a git-based scraper, parser & validator

interface ContentParser {
  key: string
  struct: Struct<any>
}

export interface GitScraperModule {
  fetchContent(toParse: ContentParser[]): Promise<any>

  readAndParse<T>(
    basePath: string,
    pattern: string,
    struct: Struct<T>
  ): Promise<[StructError[], T[]]>

  readAndParseJson<T>(
    basePath: string,
    file: string,
    struct: Struct<T>
  ): Promise<[StructError, undefined] | [undefined, T]>
}

export interface GitScraperOptions {}

export function createGitScraperModule({}: GitScraperOptions): GitScraperModule {
  throw new Error('Not implemented')
}
