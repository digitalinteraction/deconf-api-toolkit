import Minio from 'minio'
import { DeconfBaseContext } from './context'

type Context = Pick<DeconfBaseContext, 'env'>

export class S3Service {
  get #env() {
    return this.#context.env
  }

  #client: Minio.Client
  #context: Context
  constructor(context: Context) {
    this.#context = context
    this.#client = new Minio.Client({
      endPoint: this.#env.S3_ENDPOINT,
      accessKey: this.#env.S3_ACCESS_KEY,
      secretKey: this.#env.S3_SECRET_KEY,
    })
  }

  uploadFile(objectName: string, data: Buffer) {
    return this.#client.putObject(this.#env.S3_BUCKET_NAME, objectName, data)
  }
}
