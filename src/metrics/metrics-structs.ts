import { any, boolean, object, string, Struct } from 'superstruct'

const eventStructs = new Map<string, Struct<any>>()

// Track the start of an email-based login from LoginView
eventStructs.set(
  'login/start',
  object({
    emailHash: string(),
  })
)

// When a user logs out on the ProfileView
eventStructs.set('login/logout', object({}))

// When a user successfully logs in from e.g. a TokenCaptureView
eventStructs.set('login/finish', object({}))

// When a user unregisters on ProfileView and wether they confirmed it or not
eventStructs.set(
  'login/unregister',
  object({
    confirmed: boolean(),
  })
)

// When a user clicks to download a Session's calendar event from SessionTile or SessionView
eventStructs.set(
  'session/ical',
  object({
    sessionId: string(),
  })
)

// When a user clicks to attend a session
eventStructs.set(
  'attendance/attend',
  object({
    sessionId: string(),
  })
)

// When a user removes their attendance of a session
eventStructs.set(
  'attendance/unattend',
  object({
    sessionId: string(),
  })
)

// When a user clicks or copies a link to a session
eventStructs.set(
  'session/link',
  object({
    sessionId: string(),
    action: string(),
    link: string(),
  })
)

// A generic page-view, perhaps triggered by vue-router
eventStructs.set(
  'general/pageView',
  object({
    routeName: string(),
    params: any(),
  })
)

export { eventStructs }
