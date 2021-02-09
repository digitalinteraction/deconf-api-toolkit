# CHANGELOG

This file documents changes

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
