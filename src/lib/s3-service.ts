import * as Minio from 'minio'
import { DeconfEnv } from './env'

type Context = {
  env: Pick<
    DeconfEnv,
    'S3_ENDPOINT' | 'S3_ACCESS_KEY' | 'S3_SECRET_KEY' | 'S3_BUCKET_NAME'
  >
}

export class S3Service {
  #client: Minio.Client
  #context: Context
  constructor(context: Context) {
    this.#context = context
    this.#client = new Minio.Client({
      endPoint: this.#context.env.S3_ENDPOINT,
      accessKey: this.#context.env.S3_ACCESS_KEY,
      secretKey: this.#context.env.S3_SECRET_KEY,
    })
  }

  uploadFile(objectName: string, data: Buffer) {
    return this.#client.putObject(
      this.#context.env.S3_BUCKET_NAME,
      objectName,
      data
    )
  }
}
