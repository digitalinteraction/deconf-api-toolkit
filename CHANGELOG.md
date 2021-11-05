# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [4.0.0](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.0.0-beta.12...v4.0.0) (2021-11-05)

## [4.0.0-beta.12](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.0.0-beta.11...v4.0.0-beta.12) (2021-10-08)

### ⚠ BREAKING CHANGES

- **pretalx:** remove getSessionLocales method

### Features

- **pretalx:** map pretalx Resources ([cd3d2a8](https://github.com/digitalinteraction/deconf-api-toolkit/commit/cd3d2a84cbb6f1b303d8862c844c4845304c6add))
- **pretalx:** remove getSessionLocales method ([ecaf5a4](https://github.com/digitalinteraction/deconf-api-toolkit/commit/ecaf5a4ed2925b3e94413c9baf03958264cfc73c))

### Bug Fixes

- **pretalx:** improve id generation ([f0438c7](https://github.com/digitalinteraction/deconf-api-toolkit/commit/f0438c76e6b323ea3dc02e7454db76a45426b174))
- **pretalx:** improve pretalx URL parsing ([98fc043](https://github.com/digitalinteraction/deconf-api-toolkit/commit/98fc04350e54bc61d1d0512ae08eba8641b6d96f))

## [4.0.0-beta.11](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.0.0-beta.10...v4.0.0-beta.11) (2021-09-28)

### Bug Fixes

- **interpret:** tell channel joiners if the session has already started ([0577722](https://github.com/digitalinteraction/deconf-api-toolkit/commit/0577722bdda306f5d4a80122c7e752d01908ca70))
- normalise socket metrics naming ([97cd30c](https://github.com/digitalinteraction/deconf-api-toolkit/commit/97cd30c99c0e3a3cabfab1adddff378ba980e473))

## [4.0.0-beta.10](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.0.0-beta.9...v4.0.0-beta.10) (2021-09-28)

### Bug Fixes

- made SocketService joinRoom and leaveRoom async ([d9ef8e2](https://github.com/digitalinteraction/deconf-api-toolkit/commit/d9ef8e2a52273a7d3757fe258277552abc3c4a27))

## [4.0.0-beta.9](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.0.0-beta.8...v4.0.0-beta.9) (2021-09-27)

### Features

- **interpret:** send the interpreter their self record on join ([34068cb](https://github.com/digitalinteraction/deconf-api-toolkit/commit/34068cb3c768be133d7a4ffaf8ae59dc2c4b6b76))

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
