export class ApiError extends Error {
  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400 */
  static badRequest() {
    return new this(400, ['general.badRequest']).#trimStack()
  }

  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401 */
  static unauthorized() {
    return new this(401, ['general.unauthorized']).#trimStack()
  }

  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404 */
  static notFound() {
    return new this(404, ['general.notFound']).#trimStack()
  }

  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500 */
  static internalServerError() {
    return new this(500, ['general.internalServerError']).#trimStack()
  }

  /** https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501 */
  static notImplemented() {
    return new this(501, ['general.notImplemented']).#trimStack()
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

  // Remove the top line from a stack trace
  // useful for static methods so it shows where that method was called
  // and not the static method's "new" operation
  // Which in turn makes jest output *a lot* more useful
  #trimStack() {
    this.stack = this.stack?.split('\n').slice(1).join('\n')
    return this
  }
}
