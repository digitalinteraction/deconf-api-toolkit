# lib

The lib module contains useful functions and services to be used throughout all modules.

## Api errors

> TODO

## Config

> TODO

## Constants

> TODO

## Context

> TODO

## Email

### EmailService

A service for sending html or transactional emails powered by Sendgrid

```ts
const env: DeconfEnv
const config: DeconfConfig

const email = new EmailService({ env, config })

// Send a HTML email
await email.sendEmail(
  'geoff@example.com',
  'Hi Geoff!',
  `<p> Welcome to your new account! </p>`
)

// Send a transaction email, i.e. the template is setup on app.sendgrid.com
await email.sendTransactional(
  'geoff@example.com',
  'Hi Geoff!',
  'd-abcdefghijklmnop',
  {
    firstName: 'Geoff',
    body: 'Welcome to your new account!',
    action: 'Log in',
    href: 'https://example.com/login',
  }
)
```

## Env

> TODO

## I18n

> TODO

## JWT

### JWT_ISSUER

**deprecated** — use `JWT_DEFAULT_ISSUER`

### JWT_DEFAULT_ISSUER

`JWT_DEFAULT_ISSUER` is the JWT `iss` (issuer) if it has not set via config.

### bearerRegex

`bearerRegex` creates a regex to test if a string is a `bearer xyz` header.
It is case insensitive.

### AuthzHeadersStruct

`AuthzHeadersStruct` is a structure to assert an object containing authorization headers.

### AuthTokenStruct

`AuthTokenStruct` is structure to assert an object is an authentication JWT payload

### EmailLoginTokenStruct

`EmailLoginTokenStruct` is a structure to assert an object is an email login JWT payload

### VerifyTokenStruct

`VerifyTokenStruct` is a structure to assert an object is a verification JWT payload

### JwtSignOptions

`JwtSignOptions` is a type containing extra options when signing a JWT

### SocketAuth

`SocketAuth` is a collection of data about a user to be stored together against
a socket id for the purpose of authenticating and accessing information about them.

### JwtService

`JwtService` is a service for verifying and signing JWTs.
It requires a `store`, `config` and an `env` with `JWT_SECRET` in it.
It also manages socket authentication, storing auth data in the `store`.

```ts
const store: KeyValueService
const config: DeconfConfig
const env: DeconfEnv

const jwt = new JwtService({ store, config, env })
```

#### verifyToken

`verifyToken` verifies a JWT string was signed by the app and conforms to a structure.
It throws `ApiError(401)` errors if something is wrong:

- `auth.tooEarly`
- `auth.tokenExpired`
- `auth.badToken`

or a `StructApiError` if the payload does not match the structure.
If it doesn't throw, it returns the decoded payload.

```ts
const NameStruct = object({ name: string() })
const payload = jwt.verifyToken('abc.def.ghi', NameStruct)
```

#### signToken

`signToken` takes a JWT payload, signs it and returns it as a JWT string.
You can pass extra options with a `JwtSIgnOptions`.

> See https://github.com/auth0/node-jsonwebtoken#usage for more options.

```ts
const token = jwt.signToken({ name: 'Geoff' }, { expiresIn: '55m' })
```

#### getSocketAuth

`getSocketAuth` retrieves the authentication packet for a socket.
It takes the socket's id as a parameter
and it will throw a `http/401` if the packet isn't found.

```ts
const auth = await jwt.getSocketAuth('abcdefg')
```

#### getRequestAuth

`getRequestAuth` is a helper to find and verify an authentication token out of a http headers object.
It returns `null` if one is not found or a `AuthToken` if it is.
It will also throw the same errors as `verifyToken`.

```ts
const payload = jwt.getRequestAuth({
  authorization: 'bearer abc.def.ghi',
})
```

## Redis

### createRedisClient

`createRedisClient` wraps creating a [redis](https://github.com/redis/node-redis) `RedisClient`.
Its reason for being is to handle `rediss://` URLs which the library doesn't currently support.

> https://stackoverflow.com/questions/61875554/

### closeRedisClients

`closeRedisClients` closes multiple `RedisClient` instances at once
and resolves when are the clients are closed.

## Resources

> TODO

## S3

> TODO

## Semaphore

> TODO

## Sockets

> TODO

## Structs

> TODO

## Url

> TODO
