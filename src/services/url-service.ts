import path = require('path')

export function appendUrl(url: URL, extraPath: string) {
  return new URL(path.join(url.pathname, extraPath), url.origin)
}

/**
 * A service for formatting urls to the api itself or the associated web app
 */
export interface UrlService {
  getSessionLink(sessionId: string): URL
}

export function createUrlService(selfUrl: string, webUrl: string): UrlService {
  const self = new URL(selfUrl)
  const web = new URL(webUrl)

  return {
    getSessionLink(sessionId) {
      return appendUrl(web, `/session/${sessionId}`)
    },
  }
}
