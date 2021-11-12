# Pretalx

The pretalx module connects to the
[Pretalx API](https://docs.pretalx.org/api/fundamentals.html)
to retrive information and convert to deconf types.

<!-- pretalx-service -->

## PretalxService

`PretalxService` provides access to the Pretalx API
and provides methods to convert pretalx resources into deconf ones.

```ts
const store: KeyValueStore
const env = {
  PRETALX_API_TOKEN: 'abcdefgh',
}
const config = {
  eventSlug: 'abcdefgh',
  englishKeys: ['en'],
}

const pretalx = new PretalxService({ store, env, config })
```

### Data accessors

Methods to access data using the pretalx API.

- `getQuestions`
- `getEvent`
- `getSubmissions`
- `getTalks`
- `getSpeakers`
- `getTags`

### Helpers

#### findAnswer

`findAnswer` gets the answer to a specific question from an array of responses.

#### getSlotId

`getSlotId` generates a unique id for a pretalx slot

#### isUrl

`isUrl` determines if a string passed is a URL or not

#### makeUnique

`makeUnique` takes a possibly duplicated id and makes sure it is unique
(within the life of the PretalxService itself)

#### getIdFromTitle

`getIdFromTitle` converts a localised text title into a slug

#### getSlug

`getSlug` converts a text string into a URL friendly slug

### Conversions

#### getDeconfSlots

`getDeconfSlots` finds the unique slots from a set of pretalx talks

#### getDeconfSpeakers

`getDeconfSpeakers` converts pretalx speakers to deconf

#### getDeconfThemes

`getDeconfThemes` converts pretalx tags to themes

#### getSessionLinks

`getSessionLinks` generates a set of `LocalisedLinks` for a session
based on the answers to multiple questions

#### getSessionCap

`getSessionCap` finds the answer to a numeric question
and attempts to parse the number as an integer.
It returns the number if it is found, or null if not found or not a numeric string.

---

<!-- pretalx-structs -->

## PretalxConfigStruct

`PretalxConfigStruct` validates the configuration for a `PretalxService`

<!-- pretalx-types -->

## Pretalx types

The pretalx module provides TypeScript definition for some pretalx structures,
namely the ones that are needed for deconf.

- `Localised`
- `PretalxEvent`
- `PretalxSpeaker`
- `PretalxSlot`
- `PretalxResponse`
- `PretalxQuestion`
- `PretalxAnswer`
- `PretalxTalk`
- `PretalxTax`
- `PretalxResource`
