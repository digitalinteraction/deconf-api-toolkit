# Conference

The conference module is an API to retrieve and process conference information.

<!-- calendar-routes.ts -->

## getIcsDate

`getIcsDate` formats a `Date` for the `ics` library,
i.e. `[year, month, date, hour, minutes]` as UTC values.

```ts
const icsFormat = getIcsDate(new Date())
```

## getGoogleDate

`getGoogleDate` formats a `Date` for the `calendar.google.com`,
i.e. `yyyymmddThhmmssZ` as UTC values.

```ts
const googleFormat = getGoogleDate(new Date())
```

## getSessionIcsAttributes

> **internal** — generates `ics` parameters for a `Session` + `Slot`

## CalendarRoutes

`CalendarRoutes` provides routes for processing conference data into calendar events.

```ts
const conferenceRepo: ConferenceRepository
const url: UrlService
const attendanceRepo: AttendanceRepository

const calendarRoutes = new CalendarRoutes({
  conferenceRepo,
  url,
  attendanceRepo,
})
```

### getSessionIcsFile

`getSessionIcsFile` returns a translated ics file from a `Session`.
It returns a string which is the contents of the ics file.

```ts
const file = await calendarRoutes.getSessionIcsFile('en', 'session-a')
```

Set these headers for it to download nicely:

- `Content-Type: text/calendar`
- `Content-Disposition: attachment; filename="{session_id}.ics`
  — where `session_id` is the id of the session being downloaded

Potential errors:

- `general.notFound` — if the session is not found or is not scheduled
- `general.internalServerError` — if there was an unknown error generating the ics.

### getGoogleCalendarUrl

`getGoogleCalendarUrl` generates a URL to add a `Session` to a visitor's Google Calendar.
Redirect the visitor to the returned URL so they can add the session to their calendar.

```ts
const url = await calendarRoutes.getGoogleCalendarUrl('en', 'session-a')
```

Potential errors:

- `general.notFound` — if the session is not found or is not scheduled

### getUserIcs

`getUserIcs` generates an ICS file with all sessions a visitor is attending.
see `getSessionIcsFile` for the best headers to set.

```ts
const file = await calendarRoutes.getSessionIcsFile(icalToken)
```

Potential errors:

- `general.unauthorized` — if `icalToken` is not passed, it should be validated elsewhere.
- `general.internalServerError` — if there was an unknown error generating the ics.

---

<!-- conference-config-struct.ts -->

## PageFlagStruct

`PageFlagStruct` validates an object is a `PageFlag`

## ConferenceConfigStruct

`ConferenceConfigStruct` validates an object is a `ConferenceConfig`

---

<!-- conference-repository.ts -->

## ConferenceRepository

`ConferenceRepository` is responsible for retrieving conference information from a `KeyValueStore`.

```ts
const store: KeyValueStore

const conferenceRepo = new ConferenceRepository({ store })
```

### getSlots

`getSlots` returns the slots for a conference, which are the timespans available
for sessions to occur in. They group sessions together in the schedule.

`ConferenceRepository` assumes the `store` serialises values as JSON and `getSlots`
makes sure to unserialise the `start` and `end` date of each slot.

```ts
const slots = conferenceRepo.getSlots()
```

### getSessions

`getSessions` fetches the conference's `Session` records.

```ts
const sessions = await conferenceRepo.getSessions()`
```

### findSession

`findSession` finds a specific record with an id, or returns `null`.

```ts
const session = await conferenceRepo.findSession('session-a')`
```

### getThemes

`getThemes` fetches the conference's `Theme` objects.

```ts
const themes = await conferenceRepo.getThemes()`
```

### getSpeakers

`getSpeakers` fetches the conference's `Speaker` objects.

```ts
const speakers = await conferenceRepo.getSpeakers()`
```

### getTypes

`getTypes` fetches the conference's `SessionType` objects.

```ts
const sessionTypes = await conferenceRepo.getTypes()`
```

### getSettings

`getSettings` fetches the conference's `ConferenceConfig` object
or `null` if it is not set.

```ts
const settings = await conferenceRepo.getSettings()`
```

### getInterpreters

`getInterpreters` fetches the conference's `Interpreter` objects.
These are used to assign `user_roles` when authenticating.

```ts
const interpreters = await conferenceRepo.getInterpreters()`
```

### findInterpreter

`findInterpreter` finds a specific interpreter with an email, or returns `null`.

```ts
const interpreter = await conferenceRepo.findInterpreter('jess@example.com')`
```

---

<!-- conference-routes.ts -->

> WIP

---

<!-- link-struct.ts -->

> WIP

---

<!-- localised-struct.ts -->

> WIP

---

<!-- mock-schedule-command.ts -->

> WIP

---

<!-- session-struct.ts -->

> WIP

---

<!-- session-type-struct.ts -->

> WIP

---

<!-- slot-struct.ts -->

> WIP

---

<!-- speaker-struct.ts -->

> WIP

---

<!-- theme-struct.ts -->

> WIP

---

<!-- track-struct.ts -->

> WIP
