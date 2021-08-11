export class ApiError extends Error {
  static badRequest() {
    return new this(400, ['general.badRequest'])
  }
  static notAuthorized() {
    return new this(401, ['general.notAuthorized'])
  }
  static notFound() {
    return new this(404, ['general.notFound'])
  }
  static unknown() {
    return new this(500, ['general.unknown'])
  }

  constructor(public status: number, public codes: string[]) {
    super(
      `There were error(s) with your request: ${codes
        .map((c) => `"${c}"`)
        .join('\n')}`
    )
  }
}
