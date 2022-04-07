# Attendance

The attendance module is an API to let attendees mark which sessions they are interested in going to

<!-- attendance-repository.ts -->

## AttendanceRepository

`AttendanceRepository` provides logic for storing and retrieving session interest in the database.

```ts
const postgres: PostgresService

const attendanceRepo = new AttendanceRepository({
  postgres,
})
```

### attend

`attend` marks an attendee as interested in a session from the attendee and session's ids.
The attendee's id is most likely to come from an `AuthToken`'s `sub` property.

```ts
await attendanceRepo.attend(5, 'session-a')
```

### unattend

`unattend` is the opposite of `attend`, it removes any interest records for an attendee and a given session.

```ts
await attendanceRepo.unattend(5, 'session-a')
```

### getSessionAttendance

`getSessionAttendance` create a map of session id to the number of attendees interested in that session.

```ts
const sessionAttendance = await attendanceRepo.getSessionAttendance()

// e.g.
sessionAttendance.get('session-a') // 5
```

### getUserAttendance

`getUserAttendance` gets a list of the `Attendance` records that an attendee has created.

```ts
const userAttendance = await attendanceRepo.getUserAttendance()
```

<!-- attendance-routes.ts -->

## AttendanceRoutes

`AttendanceRoutes` provides routes for adding, removing and querying attendee attendance.

```ts
const conferenceRepo: ConferenceRepository
const registrationRepo: RegistrationRepository
const attendanceRepo: AttendanceRepository
const jwt: JwtService

const app = express().use(express.json())

const attendanceRoutes = new AttendanceRoutes({
  conferenceRepo,
  registrationRepo,
  attendanceRepo,
})
```

These general errors might occur with any of the `AttendanceRoutes`:

- `general.unauthorized` — the authToken was missing or not verified
- `general.notFound` — the related session does not exist

### attend

`attend` marks a user as attending/interested in a session.

Extra potential errors:

- `general.badRequest` — the session has met it's participation cap

```ts
app.post('/attendance/attend/:sessionId', async (req, res) => {
  res.send(
    await attendanceRoutes.attend(
      jwt.getRequestAuth(req.headers),
      req.params.sessionId
    )
  )
})
```

### unattend

`unattend` remove's an attendee's attendance/interest in a session.

```ts
app.post('/attendance/unattend/:sessionId', async (req, res) => {
  res.send(
    await attendanceRoutes.unattend(
      jwt.getRequestAuth(req.headers),
      req.params.sessionId
    )
  )
})
```

### getSessionAttendance

`getSessionAttendance` gets the attendance for a session and whether the current user is attending it.

```ts
app.get('/attendance/session/:sessionId', async (req, res) => {
  res.send(
    await attendanceRoutes.getSessionAttendance(
      jwt.getRequestAuth(req.headers),
      req.params.sessionId
    )
  )
})
```

### getUserAttendance

`getUserAttendance` fetches the sessions an attendee is attending.

```ts
app.get('/attendance/me', async (req, res) => {
  res.send(
    await attendanceRoutes.getUserAttendance(jwt.getRequestAuth(req.headers))
  )
})
```

<!-- attendance-struct.ts -->

## AttendanceStruct

`AttendanceStruct` validates an object is a `Attendance`
