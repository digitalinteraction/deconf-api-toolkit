/**
 * The content module is an API to fetch markdown content from a git repo,
 * parse it into HTML and serve it as an endpoint.
 *
 * The content module requires a git repo with a file structure like this:
 *
 * ```
 * ├── content
 * │   ├── about
 * │   │   ├── ar.md
 * │   │   ├── en.md
 * │   │   ├── es.md
 * │   │   └── fr.md
 * │   ├── atrium
 * │   │   ├── ar.md
 * │   │   ├── en.md
 * │   │   ├── es.md
 * │   │   └── fr.md
 * │   ├── ...
 * │   └── some-config.json
 * ```
 *
 * - A piece of `content` is a directory containing localised version of the same content,
 *   e.g. `about` or `atrium` from above
 * - The API allows custom logic to be added too,
 *   e.g. reading in `some-config.json`,
 *   aserting it's structure and saving it in the store.
 *
 * ### tags
 *
 * The content module adds a syntax to markdown to allow custom logic to be added by the frontend.
 * For example this markdown:
 *
 * ```md
 * Hello, world
 *
 * %feature_video%
 * ```
 *
 * gets turned into:
 *
 * ```html
 * <p>Hello, world</p>
 * <div id="feature_video"></div>
 * ```
 *
 * And the frontend can dynamically swap a div with that id to a video component.
 *
 * **how it works**
 *
 * Any `%` pair on an empty line gets swapped to a `div`.
 * The id of the div is the text between the two `%` characters.
 *
 * For more information see `ApiContent` in `digitalinteraction/deconf-ui-toolkit`.
 *
 * @module content
 */

export * from './content-repository'
export * from './content-routes'
export * from './content-service'
