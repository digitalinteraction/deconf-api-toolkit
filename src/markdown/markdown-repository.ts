import { DeconfBaseContext } from '../module'

type Context = Pick<DeconfBaseContext, 'store'> & {
  execute(command: string): Promise<void>
}

export class MarkdownRepository {
  get #store() {
    return this.#context.store
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  fetchContent(repoDir: string) {}
}
