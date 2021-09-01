import dedent from 'dedent'

import { RESOURCE_CARBON_LOCATIONS } from '../carbon/carbon-routes'

export function createTestingResources() {
  const resources = new Map<string, Buffer>()

  resources.set(
    RESOURCE_CARBON_LOCATIONS,
    Buffer.from(
      JSON.stringify([
        {
          code: 'GB',
          name: 'United Kingdom',
          location: { lat: 55.378051, lng: -3.435973 },
        },
        {
          code: 'FR',
          name: 'France',
          location: { lat: 46.227638, lng: 2.213749 },
        },
        {
          code: 'CH',
          name: 'Switzerland',
          location: { lat: 46.818188, lng: 8.227511999999999 },
        },
      ])
    )
  )

  return resources
}
