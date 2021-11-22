import fs from 'fs/promises'
import cp from 'child_process'
import { promisify } from 'util'

const exec = promisify(cp.exec)

type Context = {}

export class ContentRepository {
  #context: Context

  constructor(context: Context) {
    this.#context = context
  }

  async validateRemote(remoteUrl: string) {
    const { stderr } = await exec(`git ls-remote ${remoteUrl}`)
    return !Boolean(stderr)
  }

  async updateLocalRepo(directory: string, remoteUrl: string, branch: string) {
    // Switch to the branch
    await exec(`git -C "${directory}" checkout ${branch}`)

    // Pull into the branch
    await exec(`git -C "${directory}" pull ${remoteUrl} ${branch}`)
  }

  async cloneRepo(directory: string, remoteUrl: string, branch: string) {
    // Clone the repo under that branch
    await exec(`git clone --branch ${branch} ${remoteUrl} "${directory}"`)
  }

  async clearDirectory(directory: string) {
    await exec(`rm -rf "${directory}"`)
  }

  async makeTempDir(prefix: string) {
    return fs.mkdtemp('content_')
  }
}
