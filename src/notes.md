```ts
interface HttpResponse {}

export declare class EventsService {
  emit(key: string, ...args: any[]): void
}

// export declare class AuthService {
//   fromSocket(socketId: string): Promise<AuthJwt | null>
//   fromRequestHeaders(headers: object): Promise<AuthJwt | null>
// }

// export declare class I18nService {
//   translate(locale: string, key: string, variables?: any): string
// }

// export declare class JwtService {}

// export declare class UsersService {}

// export declare class PostgresService {}

// export declare class RedisService {}

// export declare class UrlService {}

// export declare class EnvService {}

//
// Auth module
//
export declare class AuthModule {
  constructor(options: {
    i18n: I18nService
    jwt: JwtService
    users: UsersService
    pg: PostgresService
    events: EventsService
  })

  // GET /me
  getRegistration(authorization?: string): Promise<HttpResponse>

  // POST /login
  startEmailLogin(email: string): Promise<HttpResponse>

  // GET /login/callback
  finishEmailLogin(token: string): Promise<HttpResponse>

  // POST /register
  startRegister(options: {
    name: string
    email: string
    language: string
    country: string
    affiliation: string
  }): Promise<HttpResponse>

  // GET /register/callback
  finishRegister(token: string): Promise<HttpResponse>

  // DELETE /me
  unregister(token: string): Promise<HttpResponse>
}

//
// Attend module
//
export declare class AttendModule {
  constructor(options: {
    schedule: ScheduleModule
    auth: AuthService
    users: UsersService
    pg: PostgresService
  })

  // POST /attend/:session_id
  attend(token: string, sessionId: string, cap: number): Promise<HttpResponse>

  // POST /unattend/:session_id
  unattend(token: string, sessionId: string): Promise<HttpResponse>

  // GET /attendance/:session_id
  attendance(token: string, sessionId: string): Promise<HttpResponse>
}

//
// Schedule module
//
export declare class ScheduleModule {
  constructor(options: {
    redis: RedisService
    url: UrlService
    env: EnvService
    auth: AuthService
  })

  // GET /ics/:session_id
  ics(sessionId: string): Promise<HttpResponse>

  // GET /sessions
  getSessions(token?: string): Promise<HttpResponse>

  // GET /settings
  getSettings(): Promise<HttpResponse>

  // GET /slots
  getSlots(): Promise<HttpResponse>

  // GET /speakers
  getSpeakers(): Promise<HttpResponse>

  // GET /themes
  getThemes(): Promise<HttpResponse>

  // GET /tracks
  getTracks(): Promise<HttpResponse>

  // GET /types
  getTypes(): Promise<HttpResponse>
}

//
// Carbon module
//
export declare class CarbonModule {
  constructor(options: { redis: RedisService; pg: PostgresService })

  // GET /carbon
  getCarbon(): Promise<HttpResponse>
}
```
