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

> TODO

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
