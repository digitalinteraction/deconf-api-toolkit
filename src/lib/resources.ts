import fs from 'fs/promises'
import path from 'path'
import createDebug from 'debug'

const debug = createDebug('deconf:lib:resources')

export type ResourcesMap = Map<string, Buffer>

/** Recursively load files in a directory and generate an Entries object */
async function loadFilesRecursively(directory: string) {
  debug('loadFilesRecursively %o', directory)

  const children = await fs.readdir(directory)
  const entries: [string, Buffer][] = []

  for (const child of children) {
    const childPath = path.join(directory, child)
    const stat = await fs.stat(childPath)

    if (stat.isDirectory()) {
      entries.push(...(await loadFilesRecursively(childPath)))
    }

    if (stat.isFile()) {
      entries.push([childPath, await fs.readFile(childPath)])
    }
  }
  return entries
}

/** Load resources in a directory and put into a Map based on the cwd */
export async function loadResources(basedir: string) {
  debug('loadResources %o %o', process.cwd(), basedir)

  const entries = await loadFilesRecursively(basedir)
  for (let entry of entries) entry[0] = entry[0].replace(`${basedir}/`, '')
  return new Map(entries)
}
