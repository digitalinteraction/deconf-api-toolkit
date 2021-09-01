# Development

Notes about development on this project.

## Style Guide

This is a living section about the styles used to write code.

### Modules

The code is split up into modules like `attendance` or `metrics` and
there is a shared module called `lib`.
A module has a `module.ts` which should be used to import all the modules exports.

There are categories of code in a module to split up the logic
and enable good unit-testing:

- **Routes** provide the logic for a http route.
  File ending `...-routes.ts`.
- **Sockets** provide the logic for socket.io endpoint.
  File ending `...-sockets.ts`.
- **Repositories** are responsible for accessing and mutating data.
  For example, running a database query or fetching something from redis.
  File ending `...-repository.ts`.
- **Structs** are [superstruct](https://github.com/ianstormtaylor/superstruct)
  structure for validating javascript values and objects.
  File ending `...-struct.ts`.
- **Types** are common re-usable TypeScript types.
  File ending `...-struct.ts`.

Modules should also provide their own tests for at-least their **routes** and **sockets**.

### Dependency Injection

Most code is based around the idea of [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection).
This is achieved through code being defined as classes with dependencies injected in the constructor of those objects.
To further improve this, most code can pick dependencies from a common "context" called `DeconfBaseContext`.
The context **must** be an es-private field so as not to pollute the interface.
ES getters are also used to access context properties, which **must** also be es-private fields.

As an example:

```ts
// Pick the jwt and semaphore module off the context
// Not exported
type Context = Pick<DeconfBaseContext, 'jwt' | 'semaphore'>

export class ExampleRoutes {
  // Provide easier access to the jwt module
  // Must be an ES private field
  get #jwt() {
    return this.#context.jwt
  }

  // The DI context for this bit of code
  // Must be ES-private and assigned in the constructor
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }
}
```

As a general rule only **Routes** and **Sockets** are allowed to have non-`DeconfBaseContext` fields in their context.
This allows those public modules to have customisable logic per deployment.

To see an example of how to use these modules, [see examples/express-app.ts](/examples/express-app.ts).

### Testing

The `lib` module, **Routes** and **Sockets** must be unit tested to ensure a consistent public API.
Tests are located inside the module and a `__tests__` folder
which provides easy import access to other bits of code that are needed.

**Repository** code can be tested if it is possible but it is not required
because unit-testing SQL queries is hard and visual inspection is the current standard.

> TODO: setup integration testing to run those queries against a docker database.

**Structs** should have simple tests to assert they validate the structure correctly.

#### Test library

There is a `test-lib` module with specific code to help with testing
which should be imported through `../../test-lib/module`.

**mocks** provides mock-instances of most of the common `lib` components and module `repositories`
to be easily created for tests and controlled by the tests themselves.
They are designed to be "empty" by default so the test can define how they
respond to specific requests, unless specifically documented otherwise.

**fixtures** contains methods to create the various data structures with default values set.

There is also:

- **test-i18n** which contains i18n yaml to test i18n setup
- **test-resources** which contains resources to test loading

#### Test principles

These principles describe how to structure unit tests to best test the specific behaviour
of a component.

**1. setup method**

Tests should use a `setup()` method to do common configuration for all the tests in a file
and return components to be controlled and used in each test.

```ts
function setup() {
  const url = mockUrlService()
  const conferenceRepo = mockConferenceRepo()
  const routes = new ExampleRoutes({ url, conferenceRepo })
  return { routes, url, conferenceRepo }
}
```

**2. Test Structure**

Tests should be made up of three parts, usually seperated by a line break:

- **preperation** - setup for the test in question and preparing mocks
- **execution** - running the unit of code to be tested
- **assertion** - checking the unit of code ran as expected

```ts
it('should do all the things', async () => {
  const { routes } = setup() // preperation

  const result = routes.doSomething() // execution

  expect(result).toEqual(42) // assertion
})
```

**3. All in one**

Everything relevant to a test should be included in the test `it` block itself.
If a test is asserting whether a value is set to the right thing,
it should explicitly **prepare** the test with that value
and **assert** it is the same value too.
Preferably with literals within the test, as with `sub` and the literal `1` in this test:

```ts
it('should make sure the name is set', async () => {
  const { routes } = setup()
  const authToken = mockAuthToken({ sub: 1 })

  const result = routes.getLogin(authToken)

  expect(result.id).toEqual(1)
})
```

This also applied to mocks, as they are empty by default and won't return values,
any mocked-logic should go in the **preperation** part of the test.
This uses `ts-jest`'s `mocked` utility.

```ts
import { mocked } from 'ts-jest'

it('should return true if they are logged in', () => {
  const { routes } = setup()
  const authToken = mockAuthToken()
  mocked(routes.getFromRequest).mockResolvedValue(authToken)

  const result = routes.isLoggedIn()

  expect(result).toEqual(true)
})
```

When testing an mocked object like `mockRegistration` only test for values you pass to the mock:

```ts
import { mocked } from 'ts-jest'

it('should return true if they are logged in', () => {
  const { routes, registrationRepo } = setup()

  const result = routes.checkRegistration(
    // specifically pass an email
    mockRegistration({ email: 'jess@example.com' })
  )

  expect(registrationRepo.isValid).toBeCalledWith(
    // Only test agains that email
    expect.objectContaining({ email: 'jess@example.com' })
  )
})
```

The idea is to keep everything in a test contained to make it as easy as possible
to update in the future and you only have to look in one place for that test.

**4. Structure and naming**

The test file should be the same as the name of the component it is testing,
ending with `.spec.ts`
Test files should be structured using nested `describe` blocks with `it` statements for tests.

These tests below demonstrate the naming and structuring:

_A function_

```ts
// add.ts
function add(a: number, b: number) {
  return a + b
}

// __tests__/add.spec.ts
import { add } from '../add'
describe('add', () => {
  it('should return the sum of the two numbers', () => {
    // ...
  })
})
```

_A class_

```ts
// location.ts
class Location {
  static getPlanet() {
    return 'Earth'
  }
  constructor(public location: string) {}
  toString() {
    return `${Location.getPlanet()} - ${this.location}`
  }
}

// __tests__/location.spec.ts
import { Location } from '../location'
function setup() {
  const location = new Location('Antartica')
  return location
}

describe('Location', () => {
  // Use a "." to signify a static property or field
  describe('.getPlanet', () => {
    it('should return earth', () => {
      /** ... */
    })
  })
  // Use a "#" to signify an instance property or field
  describe('#toString', () => {
    it('should format the location ', () => {
      /** ... */
    })
  })
})
```

> Also note `sub` isn't needed here as it isn't the thing being tested

**5. Known values**

While as much as possible is defined in tests, there are a couple of things that
are the same for all tests:

_env_

The testing environment is defined alongside the rest of the environment logic in
[src/lib/env.ts](/src/lib/env.ts).
These values should be used for all `env` objects in tests
and those values can be assumed in tests.
See `createdTestingEnv` for those values.

_config_

The testing config is defined alongside the rest of the configuration logic in
[src/lib/config.ts](/src/lib/config.ts).
These values should be used for all `config` objects in tests
and those values can be assumed in tests.

This makes `geoff@example.com` and admin, which may be relevant in tests.

_misc conventions_

- use `example.com` for domains and email addresses
- use `http://localhost:3000` as the server url
  - TODO this might be better as an `example.com`
- use `http://localhost:8080` as the client url
  - TODO this might be better as an `example.com`
- `jess@exmaple.com` is used for an interpreter
- `tim@exmaple.com` is used for new registrations
- `lisa@exmaple.com` is used for listening to interpretation

---

## General notes

These are generate ideas and thoughts about future changes or refactorings of the codebase.

### Typed Socket Service

```ts
//
// IDEA: typed socket-service to unknowingly pass around socket.io socket objects
// Which lets the concrete instance use socket instance methods
//
export interface SocketService<T extends { id: string }> {
  // ...

  getRoomSize(roomNameOrId: string): Promise<number>
  joinRoom(socket: T, roomName: string): void
  leaveRoom(socket: T, roomName: string): void
  getSocketRooms(socket: T): Promise<Set<string>>

  sendError(error: ApiError): void
}
```
