import { Describe, number, object, string } from 'superstruct'
import { CountryLocation } from '@openlab/deconf-shared'

export const CountryLocationStruct: Describe<CountryLocation> = object({
  code: string(),
  name: string(),
  location: object({
    lat: number(),
    lng: number(),
  }),
})
