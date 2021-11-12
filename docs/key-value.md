# KeyValue

The KeyValue module provides an abstraction for storing json-compatable values under specific keys.
e.g. for caching resources to save computations.

<!-- key-value-service -->

## KeyValueService

`KeyValueService` abstracts the storage and retrieval of json-compatable values
and provides management and expiration of those values.
All methods are asynchronous.

```ts
const store: KeyValueService
```

### retrieve

`retrieve` gets a value out of the store for you and allows you to cast it's type.

```ts
interface Puppy {
  name: string
}

const value = await store.retrieve<Puppy[]>('puppy_list')
```

### put

`put` adds a value to the store.

```ts
await store.put('puppy_list', [{ name: 'Sandie' }])
```

### checkHealth

`checkHealth` is for asserting that the store's connection is healthy,
it should reject if it is not healthy.

### setExpiry

`setExpiry` triggers the value under that key is removed in a certain amount of seconds.

```ts
const oneMinute = 60
await store.setExpiry('puppy_list', oneMinute)
```

### delete

`delete` removes a value under a specific key.

```ts
await store.delete('puppy_list')
```

### close

`close` disconnects the store from whatever it is backed by.

```ts
await store.close()
```

<!-- memory-key-value-service -->

## createMemoryStore

createMemoryStore creates a `KeyValueService` that stores values in redis.
Doesn't currently support expiration.

> This should be migrated to a class-based implementation e.g. `InMemoryService`

<!-- redis-key-value-service -->

## RedisService

`RedisService` is a `KeyValueService` that is backed by a redis database.

```ts
const store = new RedisService('redis://127.0.0.1')
```
