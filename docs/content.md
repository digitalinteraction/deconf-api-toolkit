# Content

The content module is an API to fetch markdown content from a git repo,
parse it into HTML and serve it as an endpoint.

The content module requires a git repo with a file structure like this:

```
├── content
│   ├── about
│   │   ├── ar.md
│   │   ├── en.md
│   │   ├── es.md
│   │   └── fr.md
│   ├── atrium
│   │   ├── ar.md
│   │   ├── en.md
│   │   ├── es.md
│   │   └── fr.md
│   ├── ...
│   └── some-config.json
```

- A piece of `content` is a directory containing localised version of the same content,
  e.g. `about` or `atrium` from above
- The API allows custom logic to be added too,
  e.g. reading in `some-config.json`,
  aserting it's structure and saving it in the store.

### tags

The content module adds a syntax to markdown to allow custom logic to be added by the frontend.
For example this markdown:

```md
Hello, world

%feature_video%
```

gets turned into:

```html
<p>Hello, world</p>
<div id="feature_video"></div>
```

And the frontend can dynamically swap a div with that id to a video component.

**how it works**

Any `%` pair on an empty line gets swapped to a `div`.
The id of the div is the text between the two `%` characters.

For more information see `ApiContent` in `digitalinteraction/deconf-ui-toolkit`.

## ContentService

> This module requires `git` be installed on the node.js host.

### scraping content

Create a `ContentService` for retrieving content.
It:

- Creates a temporary directory
- Clones the repo into that directory
- Pulls out the specified content from the top-level `content` folder
- Validates all the required files are there
- Combines localised files and puts them into the store
- Removes the local directory

```ts
const store = new RedisStore('redis://127.0.0.1')
const contentRepo = new ContentRepository({ store })
const contentService = new ContentSerive({ store, contentRepo })

await contentService.processRepo({
  // The remote of the git repository
  remote: 'git@github.com:username/repo.git',

  // The branch to use
  branch: 'main',

  // The known markdown content directories to look for
  contentKeys: ['about'],

  // The localisations to look for
  languages: ['en', 'fr', 'es', 'ar'],
})
```

**notes**

- ContentService will create a temporary folder (with the prefix `content`)
  to clone the repository into, after it has finished it will remove the folder again.
- ContentService will throw an error if the repo is not valid, it does a `git ls-remote` on the remote URL
- ContentService will throw an error if a content directory is missing
- ContentService will throw an error if a localisation of a content directory is missing

### re-using a directory

For development you might want to reuse a directory so as to not
have to do a fresh clone each time, for that you can pass `reuseDirectory`.

When passed, ContentService will expect the repository to be checked out at `reuseDirectory`.
It will `git checkout` to check it is on the correct branch, then `git pull`

### custom processing

ContentService has an optional `callback` parameter that can be used to
perform custom repository validation and custom retrieval of content.
For instance, to read in a JSON file, assert its structure
and write the JSON data to the store.

```ts
import fs from 'fs/promises'

const store = new RedisStore('redis://127.0.0.1')
const contentRepo = new ContentRepository({ store })
const contentService = new ContentSerive({ store, contentRepo })

await contentService.processRepo(
  {
    // The git remote to clone / update
    remote: 'git@github.com:username/repo.git',

    // The git branch to use
    branch: 'main',

    // The known markdown files to look for
    contentKeys: ['about'],

    // The localisations to look for
    languages: ['en', 'fr', 'es', 'ar'],
  },
  async function* (directory: string) {
    // Custom validation here
    const data = await fs.readFile(
      path.join(directory, 'some-config.json'),
      'utf'
    )

    yield // Once all validation is passed, the code below yield is run

    // Custom saving logic
    await store.put('content.some_config', data)
  }
)
```

Importantly, the callback is split into two parts using a generator function.
This allows all "validation" logic to be run at once
and only when all validation passes, the "saving" logic is executed.

Practically, put validation logic before the `yield` and saving logic after it.
A generator was chosen so any variables you create in your validation
can instantly be accessed during your saving logic.

## ContentRoutes

ContentRoutes is a set of routes to retrieve content.

```ts
const app = express()
const store = new RedisStore('redis://127.0.0.1')
const contentRoutes = new ContentRoutes({ store })

app.get('/content/:slug', async (req, res) => {
  res.send(await contentRoutes.getContent(req.params.slug))
})
```

### getContent

This route returns localised content for a given content slug an object like below,
where each key you passed to `languages` above is present.

```json
{
  "content": {
    "en": "<p> The English text </p>",
    "fr": "<p> The French text </p>"
  }
}
```
