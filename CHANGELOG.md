# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [4.6.1](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.6.0...v4.6.1) (2022-01-27)

### Bug Fixes

- auth packets in redis expire after 24h ([a165f5c](https://github.com/digitalinteraction/deconf-api-toolkit/commit/a165f5c97e6dbd437189f458c5390b2a00071c85))

## [4.6.0](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.5.0...v4.6.0) (2022-01-18)

### Features

- add CalendarRoutes + deprecate `ConferenceRoutes#generateIcs` ([4a8d8c3](https://github.com/digitalinteraction/deconf-api-toolkit/commit/4a8d8c315496ea04a8080ea5dff6b24f9e2d79d1))
- **conference:** add CalendarRoutes ([#35](https://github.com/digitalinteraction/deconf-api-toolkit/issues/35)) ([6bb5155](https://github.com/digitalinteraction/deconf-api-toolkit/commit/6bb5155cf741c76c24f471ad2ace4a13d3c9a36b))
- **lib:** add `localise` method to get a translation from localised content ([5958274](https://github.com/digitalinteraction/deconf-api-toolkit/commit/595827458613fca8bc106e3130709d9073316621))

### Bug Fixes

- add missing CalendarRoutes export ([1a863db](https://github.com/digitalinteraction/deconf-api-toolkit/commit/1a863dbdd3447fa9aa13f996a9b67ca5e6fc81ea))
- **conference:** fix lint typo ([393ce95](https://github.com/digitalinteraction/deconf-api-toolkit/commit/393ce9570c790025ee28844e98cc2da54e0bb0c1))

## [4.5.0](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.4.1...v4.5.0) (2022-01-17)

### Features

- add lint rule for unscheduled confirmed sessions ([d223f34](https://github.com/digitalinteraction/deconf-api-toolkit/commit/d223f34ae8f424eadf32cc62cdd681c74ff214de))

### [4.4.1](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.4.0...v4.4.1) (2022-01-06)

### Bug Fixes

- **pretalx:** fix speaker bio not being pulled through ([4a12bc0](https://github.com/digitalinteraction/deconf-api-toolkit/commit/4a12bc031270ce1f9c86d1034ff1bd3819f10251))

## [4.4.0](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.3.0...v4.4.0) (2022-01-05)

### Features

- add optional `jwt` config to customise the JWT issuer + jwt docs ([88b520e](https://github.com/digitalinteraction/deconf-api-toolkit/commit/88b520e622459c23d54b2696f80789ca86f27d87))

## [4.3.0](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.2.1...v4.3.0) (2021-12-01)

### Features

- add metrics structs for validating metrics payloads ([3fb0d74](https://github.com/digitalinteraction/deconf-api-toolkit/commit/3fb0d74dd78dfcdd46dfcad2401795f1ddab99ef)), closes [#27](https://github.com/digitalinteraction/deconf-api-toolkit/issues/27)
- **conference:** add mock-schedule configuration and make interpreters optional ([094943f](https://github.com/digitalinteraction/deconf-api-toolkit/commit/094943f9840f958fed4d19d3fa71f1bb5ee5cd22))
- **lib:** add debug message to `loadConfig` to help debug dev crashes ([7cec2f8](https://github.com/digitalinteraction/deconf-api-toolkit/commit/7cec2f87e01d07d2d78bc5e61549bf1c2a766e61)), closes [#25](https://github.com/digitalinteraction/deconf-api-toolkit/issues/25)

### [4.2.1](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.2.0...v4.2.1) (2021-11-22)

### Bug Fixes

- **content:** fix directory not passed to callback ([db589cf](https://github.com/digitalinteraction/deconf-api-toolkit/commit/db589cfa4d7f8da55c037d036fa5bab2d1a0a4f7))
- **content:** fix remote validation not working ([e25df2b](https://github.com/digitalinteraction/deconf-api-toolkit/commit/e25df2bb1c73404f69e023425c198b44d4c8e4bb))

## [4.2.0](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.1.0...v4.2.0) (2021-11-18)

### Features

- use explicit return types for sockets & routes to help client usage ([eddfb90](https://github.com/digitalinteraction/deconf-api-toolkit/commit/eddfb906f45c460015ce91ad1ccf93c4d1a19f8a))

### Bug Fixes

- **attendance:** getSessionAttendance now returns count as a number ([6be116d](https://github.com/digitalinteraction/deconf-api-toolkit/commit/6be116dd257ce0c4ded1bd5a11691c2d8a4c9edb))
- **content:** fix broken ContentRoutes return ([e94d003](https://github.com/digitalinteraction/deconf-api-toolkit/commit/e94d00301869b4fb61856727a96b32ec992aba8a))

## [4.1.0](https://github.com/digitalinteraction/deconf-api-toolkit/compare/v4.0.0...v4.1.0) (2021-11-12)

### Features

- add Content module [#14](https://github.com/digitalinteraction/deconf-api-toolkit/issues/14) ([666456e](https://github.com/digitalinteraction/deconf-api-toolkit/commit/666456e7cf35aa84b752c54fdc0afb12c5f7bf5d))
- add DevAuthCommand to generate & output auth JWTs for development ([9250d89](https://github.com/digitalinteraction/deconf-api-toolkit/commit/9250d898711b53b35c5150bde9cf97b0b5ed602c))
- add key-value module and RedisService ([ba0add7](https://github.com/digitalinteraction/deconf-api-toolkit/commit/ba0add78947fd74c405fc468de55b9600e35a863)), closes [#18](https://github.com/digitalinteraction/deconf-api-toolkit/issues/18)
- add MockScheduleCommand to quickly generate a schedule and store it ([681fb73](https://github.com/digitalinteraction/deconf-api-toolkit/commit/681fb735c150207bb5c1ef5a5161c41cf8ff0c19))
- add transational email support to EmailService ([0b59e84](https://github.com/digitalinteraction/deconf-api-toolkit/commit/0b59e84af7fa945fbc3e7174d96ca3c2809906d3)), closes [#16](https://github.com/digitalinteraction/deconf-api-toolkit/issues/16)
- **database:** add postgres healthcheck ([33b980b](https://github.com/digitalinteraction/deconf-api-toolkit/commit/33b980bb57b4b341774bae08ad9732f35db99881))
- **database:** reduce PostgresService's env requirement ([ad6918f](https://github.com/digitalinteraction/deconf-api-toolkit/commit/ad6918fd1e9668ddfa019b36acaec3ec4fa0e479))

### Bug Fixes

- remove use of SessionLink, add LocalisedLinkStruct and deprecate SessionLinkStruct ([d459618](https://github.com/digitalinteraction/deconf-api-toolkit/commit/d459618265a1db1b1dfbae19155cd8c5a65a1907))
- update PertalxConfixStruct to match PretalxService's config ([878c1fc](https://github.com/digitalinteraction/deconf-api-toolkit/commit/878c1fcbf117dbd530b98ad2421695d2ed1bc8dc)), closes [#12](https://github.com/digitalinteraction/deconf-api-toolkit/issues/12)

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
