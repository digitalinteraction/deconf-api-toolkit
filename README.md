# deconf-api-toolkit

<!-- toc-head -->

## Table of contents

- [Architecture](#architecture)
- [How does it work](#how-does-it-work)
- [Extensions](#extensions)
- [Development](#development)
  - [setup](#setup)
  - [regular use](#regular-use)
  - [irregular use](#irregular-use)
  - [example app](#example-app)
  - [releasing](#releasing)

<!-- toc-tail -->

deconf is a set of libraries for running decentralised virtual conferences.
This toolkit is a http-agnostic node.js package for creating a headless API to run a conference.

This library is currently an adaptation from
[digitalinteraction/climatered-api](https://github.com/digitalinteraction/climatered-api)
which was the API behind the [climate.red](https://climate.red) virtual summit.

The purpose of this library is to take the knowledge and experience we gained from
running that conference and to expose the functionality to run more conferences.

This API toolkit is being design hand-in-hand with a UI toolkit which does the
same for the visual components of the conference - _work in progress_

## Architecture

Api toolkit is designed to be framework agnostic in terms of a http lbrary (e.g. express),
but it does rely on some infrastructure.

- It uses a redis cache to store conference resources which are served to users
- It uses JWT authentication to authorize access to resources and links
- It uses postgres to store attendees and track their attendance to sessions

Efforts might be made in the future to make the toolkit more agnostic
but for not you can swap out modules/services by supplying something with the same interface.

## How does it work

The features of the conference have been split up into interchangable modules
so you can configure your own conference API with some or all of the same features.

The current modules are:

- Accounts - _coming soon_
- Attendance - Endpoints for tracking attendance to sessions
- Carbon - Endpoints for calculating c02 savings by hosting the conference online
- Coffee - _coming soon_ - Endpoints for matchmaking webrtc coffee chats
- GitScraper - _coming soon_ - utilities for fetching, parsing & validating static content from git
- Migrate - utilities for running migrations on the postgres database
- Interpret - _coming soon_ - Endpoints for running real-time audio interpretation
- Schedule - Endpoints for the conference schedule resources

All http-releated modules return a HttpResponse instance which you can
bind to your own http framework (express, koa, etc).

```ts
class HttpResponse {
  constructor(
    public status: number,
    public body: any = '',
    public headers: any = {}
  ) {}
}
```

These modules internally use a set of services, some of which are provided
but all can be overidden to add your own implementations

- Authentication - for authenticating requests / sockets
- Conference - for pulling schedule resources from redis
- Email - **user-provided** for sending emails to users i.e. when logging in
- I18n - for loading translations and accessing them
- Jwt - for signing and verifying Json Web Tokens
- Postgres - for access to postgres with client-pooling
- Query - for querying data from postgres
- Redis - for fetching data from redis
- Url - **user provided** for creating urls for resources / pages

Services and Modules internally use structs which are written using
[superstruct](https://www.npmjs.com/package/superstruct).
see [src/structs](./src/structs)

## Extensions

Some services you need to provide yourself as there is no agnostic way of implementing them
and you can swap out any modules or services if you want to work differently.

Services are the internal reusable logic and modules are public-facing code that
can be imported and used.

The components of the toolkit rely on dependency injection to talk to each other.
A module or service is defined in three parts, say we were adding a `Random` module:

```ts
// First is the service interface
interface RandomModule {
  generateFloat(min: number, max: number): number
}

// Second is the service's options
// lets say it relies on a made up "Entropy" service
interface RandomOptions {
  entropy: EntropyService
}

// Third is the constructor for the module
function createRandomModule(options: RandomOptions): RandomModule {
  return {
    generateFloat(min, max) {
      return min + Math.floor(entropy.generate() * (max - min))
    },
  }
}
```

## Development

### setup

```bash
npm install
```

### regular use

```bash
npm test
```

### irregular use

```bash
# manually run prettier (auto-runs on git-stage)
npm run format

# manually lint typescript
npm run lint

# generate coverage and open the report
npm run coverage
open coverage/lcov-report/index.html

# generate the table of contents in this readme
npm run readme-toc

# manually compile TypeScript
npm run build
```

### example app

```bash
# Run the docker stack and start the server
# -> Redis is on redis://localhost:6379
# -> Postgres is on postgres://user:secret@localhost:5432/user
# -> Server runs on http://localhost:3000
docker-compose up -f examples/docker-compose.yml
```

### releasing

Git commits to this repo **must** follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
which lets us auto-generate the [CHANGELOG.md](/CHANGELOG.md)
and decide the next version of the package.

```bash
# generate a new version and publish it
npm release
```

---

> setup with [puggle](https://www.npmjs.com/package/puggle)
