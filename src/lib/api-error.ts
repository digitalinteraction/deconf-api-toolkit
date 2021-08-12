export class ApiError extends Error {
  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400 */
  static badRequest() {
    return new this(400, ['general.badRequest'])
  }

  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401 */
  static unauthorized() {
    return new this(401, ['general.unauthorized'])
  }

  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404 */
  static notFound() {
    return new this(404, ['general.notFound'])
  }

  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500 */
  static internalServerError() {
    return new this(500, ['general.internalServerError'])
  }

  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501 */
  static notImplemented() {
    return new this(501, ['general.notImplemented'])
  }

  constructor(public status: number, public codes: string[]) {
    super(
      `There were error(s) with your request: ${codes
        .map((c) => `"${c}"`)
        .join('\n')}`
    )
    this.name = 'ApiError'
    Error.captureStackTrace(this, ApiError)
  }
}
