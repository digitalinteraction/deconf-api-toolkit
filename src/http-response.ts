// https://en.wikipedia.org/wiki/List_of_HTTP_status_codes

export class HttpResponse {
  constructor(
    public status: number,
    public body: any = '',
    public headers: any = {}
  ) {}

  static badRequest() {
    return new HttpResponse(400, 'Bad Request')
  }

  static unauthorized() {
    return new HttpResponse(401, 'Unauthorized')
  }

  static notFound() {
    return new HttpResponse(404, 'Not Found')
  }

  static internalServerError() {
    return new HttpResponse(500, 'Internal Server Error')
  }

  static notImplemented() {
    return new HttpResponse(501, 'Not Implemented')
  }
}
