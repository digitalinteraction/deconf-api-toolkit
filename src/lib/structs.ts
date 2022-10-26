import { Failure, Struct, StructError, validate } from 'superstruct'
import { ApiError } from './api-error.js'

export class StructApiError extends ApiError {
  failures: Failure[]

  constructor(error: StructError) {
    super(400, ['general.badRequest'])
    this.failures = error.failures()
  }
}

export function validateStruct<T>(value: unknown, struct: Struct<T>): T {
  const result = validate(value, struct)
  if (result[0]) {
    result[0]
    throw new StructApiError(result[0])
  }
  return result[1]
}

export function assertStruct<T>(
  value: unknown,
  struct: Struct<T>
): asserts value is T {
  const result = validate(value, struct)
  if (result[0]) {
    result[0]
    throw new StructApiError(result[0])
  }
}
