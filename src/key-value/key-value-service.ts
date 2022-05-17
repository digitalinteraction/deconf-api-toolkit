/**
 * `KeyValueService` abstracts the storage and retrieval of json-compatable values
 * and provides management and expiration of those values.
 * All methods are asynchronous.
 *
 * ```ts
 * const store: KeyValueService
 * ```
 */
export interface KeyValueService {
  /**
   * `retrieve` gets a value out of the store for you and allows you to cast it's type.
   *
   * ```ts
   * interface Puppy {
   *   name: string
   * }
   *
   * const value = await store.retrieve<Puppy[]>('puppy_list')
   * ```
   */
  retrieve<T>(key: string): Promise<T | null>

  /**
   * `put` adds a value to the store.
   *
   * ```ts
   * await store.put('puppy_list', [{ name: 'Sandie' }])
   * ```
   */
  put<T>(key: string, value: T): Promise<void>

  /**
   * `checkHealth` is for asserting that the store's connection is healthy,
   * it should reject if it is not healthy.
   */
  checkHealth(): Promise<void>

  /**
   * `setExpiry` triggers the value under that key is removed in a certain amount of seconds.
   *
   * ```ts
   * const oneMinute = 60
   * await store.setExpiry('puppy_list', oneMinute)
   * ```
   */
  setExpiry(key: string, duractionInSeconds: number): Promise<void>

  /**
   * `delete` removes a value under a specific key.
   *
   * ```ts
   * await store.delete('puppy_list')
   * ```
   */
  delete(key: string): Promise<void>

  /**
   * `close` disconnects the store from whatever it is backed by.
   *
   * ```ts
   * await store.close()
   * ```
   */
  close(): Promise<void>
}
