import { Describe, number, object, string } from 'superstruct'
import { CountryLocation } from '@openlab/deconf-shared'

/**
 * A country identified by a unique code, e.g. an ISO alpha-2 code ([more info](https://www.gov.uk/government/publications/iso-country-codes--2)).
 * It has a friendly name and an estimated center location.
 */
export const CountryLocationStruct: Describe<CountryLocation> = object({
  code: string(),
  name: string(),
  location: object({
    lat: number(),
    lng: number(),
  }),
})
