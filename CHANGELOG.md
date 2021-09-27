# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [4.0.0-beta.8](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.0.0-beta.7...v4.0.0-beta.8) (2021-09-27)

### Bug Fixes

- **interpret:** fix message sending ([5a7c1d3](https://github.com/digitalinteraction/deconf-api-toolkit/commit/5a7c1d3194d81967b1b05efaaa20aea19f6cadf9))

## [4.0.0-beta.7](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.0.0-beta.6...v4.0.0-beta.7) (2021-09-24)

### Bug Fixes

- **metrics:** normalise error eventName ([813d053](https://github.com/digitalinteraction/deconf-api-toolkit/commit/813d053b859b5b92b855fd136e2a63cb9d87df09))
- registration sends "already verified" emails and returns custom errors ([cfa1713](https://github.com/digitalinteraction/deconf-api-toolkit/commit/cfa171314161ec6ad8d387d805bb2c8c257a42e1))

## [4.0.0-beta.6](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.0.0-beta.5...v4.0.0-beta.6) (2021-09-22)

### ⚠ BREAKING CHANGES

- **metrics:** add small delay before emiting site-visitors back

### Features

- **metrics:** add small delay before emiting site-visitors back ([d68cd09](https://github.com/digitalinteraction/deconf-api-toolkit/commit/d68cd095325434eca842b74ec805cf71c817e07c))

## 4.0.0 (next)

**SocketService**

- remove use of `getRoomSize`
- **breaking** rename `getSocketRooms` to `getRoomsOfSocket`
- **breaking** rename `getRoomSockets` to `getSocketsInRoom`

## 3.0.0

Everything has changed, WIP

## 2.2.0

**Features**

- Added optional `states` option to `ScheduleModule#getSessions` to only return
  sessions that are a specific state.
  Also removed the default filter of `!= 'draft'`

## 2.1.0

**Features**

- Added a hard-cap to `attend` endpoint based on `session.participantCap`

## 2.0.0

**BREAKING** move to `@openlab/deconf-shared` for types.
Interfaces/enums should now be imported directly from `@openlab/deconf-shared`
which is a dependency to `@openlab/deconf-api-toolkit`.

Interfaces that have changed:

**ConfigSettings**

```diff
-helpdesk
+helpDesk
```

**ConfigSettings**

```diff
-helpdesk
+helpDesk
```

**Session**

```diff
+SessionState.confirmed

-coverImage string
+coverImage string | undefined

-hostLanguage string[]
+hostLanguages string[]

- hideFromSchedule boolean | optional
+ hideFromSchedule boolean
```

## 1.0.0

Initial release
