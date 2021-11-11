# Registration

The registration module is an API that provides endpoints to signup, authenticate & verify accounts and signup.

## DevAuthCommand

DevAuthCommand is a CLI command to generate a valid authentication token and sign-in URL for local development.

```ts
const jwt: JwtService
const url: UrlService
const registrationRepo: RegistrationRepository

const command = new DevAuthCommand({ jwt, url, registrationRepo })

const { url, token } = command.process({
  email: 'jess@example.com',
  interpreter: true,
  admin: false,
})

console.log('Your dev token is %o', token)
console.log('Log in at %o', url)
```

## RegistrationRepository

RegistrationRepository is a repository that provides SQL queries
for registration.

```ts
const postgres: PostgresService

const registrationRepo = new RegistrationRepository({ postgres })
```

### getRegistrations

Get all the registrations attempts for a specific email address

```ts
const registrations = await registrationRepo.getRegistrations(
  'dalya@example.com'
)
```

### getVerifiedRegistration

Get the verified registration for an email address, or null if that email is not verified.

```ts
const verifiedRegistration = await registrationRepo.getVerifiedRegistration(
  'dalya@example.com'
)
```

### register

Create an unverified registration.

```ts
await registrationRepo.register({
  name: 'Chloe Smith',
  email: 'chloe@example.com',
  language: 'EN',
  country: 'GB',
  affiliation: 'Open Lab',
  userData: { marketingConsent: false },
})
```

### unregister

Remove all registrations, verified and unverified, for an email address.

```ts
await registrationRepo.unregister('chloe@example.com')
```

### verifyRegistration

Mark a registration as verified, e.g. The user clicked verified in an email.

```ts
// It takes the id of the registration record to be verified
await registrationRepo.verifyRegistration(42)
```

## RegistrationRoutes

A set of endpoints to handle registration, verification and email-based login.
It has two extension points, one to send emails however you'd like
and another to for custom `userData` validation.

The `mailer` dependency needs to implement `RegistrationMailer`
which is an interface for sending the emails RegistrationRoutes requires.

```ts
const mailer: RegistrationMailer = {
  async sendLoginEmail(registration: Registration, token: string) {
    // Generate and send login email
    // The user should be directed to the login endpoint with this token
  },
  async sendVerifyEmail(registration: Registration, token: string) {
    // Generate and send verification email
    // The user should be directed to the verify endpoint with this token
  },
  async sendAlreadyRegisteredEmail(registration: Registration, token: string) {
    // Generate and send an 'already registered' email,
    // to alert the user someone tried to re-register with their email.
    // Includes a login token to bypass the need to sign in again
    // if that was their intention
  },
}
```

The `userDataStruct` is a custom
[superstruct](https://github.com/ianstormtaylor/superstruct)
structure to validate what is stored in the `userData` on each registration record.

```ts
const userDataStruct = object({
  marketingConsent: boolean(),
})
```

Create a `RegistrationRoutes` like this:

```ts
const jwt: JwtService
const registrationRepo: RegistrationRepository
const conferenceRepo: ConferenceRepository
const config: DeconfConfig
const url: UrlService

const app = express().use(express.json())

const routes = new RegistrationRoutes({
  jwt,
  registrationRepo,
  conferenceRepo,
  config,
  url,
  mailer,
  userDataStruct,
})
```

### startEmailLogin

Start an email-based login. Send the user an email with a link in it which logs them in.

```ts
app.post('/auth/login', async (req, res) => {
  res.send(await routes.startEmailLogin(req.body))
})
```

Where the request body is:

```json
{
  "email": "geoff@example.com"
}
```

### finishEmailLogin

The endpoint that is triggered by a user clicking a login link in an email.
It validates the token and redirects the user to the client to finish logging in.

```ts
app.get('/auth/login/:token', (req, res) => {
  const url = await this.#routes.finishEmailLogin(req.params.token)
  res.redirect(url.toString())
})
```

### startRegister

Start off a new registration.

```ts
app.post('/auth/register', async (req, res) => {
  res.send(await routes.startRegister(req.body))
})
```

Where the body is:

```json
{
  "name": "Chloe Smith",
  "email": "chloe@example.com",
  "language": "en",
  "country": "GB",
  "affiliation": "Open Lab",
  "userData": {
    "marketingConsent": false
  }
}
```

> Where `userData` matches whatever your `userDataStruct` requires.

### finishRegister

Finish the registration process, verify the registration record
and log the user in.
`token` should come from the email the user was sent from `startRegister`.

The user can on verify a registration once and this will fail if they attempt to re-verify their registration.
This is to make verify emails single-use as they log the user in.

```ts
app.get('/auth/register/:token', async (req, res) => {
  const url = await routes.finishRegister(token)
  res.redirect(url.toString())
})
```

### unregister

Remove all registrations relating to an email address.
This requires the user with that email to be signed in.
`token` should be a valid authentication token from a login/verify.

```ts
app.del('/auth/me', async (req, res) => {
  const token = jwt.getRequestAuth(req.headers)
  res.send(await this.#routes.unregister(token))
})
```

### getRegistration

Get the registration associated with an authentication token.

```ts
app.get('/auth/me', async (req, res) => {
  const token = jwt.getRequestAuth(req.headers)
  ctx.body = await this.#routes.getRegistration(token)
})
```
