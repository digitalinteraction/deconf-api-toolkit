import redis, { ClientOpts, RedisClient } from 'redis'

// https://stackoverflow.com/questions/61875554/ssl-connections-to-redis-instance-for-socket-io-adapter
/** Create a redis client and handle ssl connections */
export function createRedisClient(redisUrl: string) {
  const options: ClientOpts = {
    url: redisUrl,
  }

  if (redisUrl.startsWith('rediss://')) {
    options.tls = { servername: new URL(redisUrl).hostname }
  }

  return redis.createClient(options)
}

/** Close one or more redis clients */
export function closeRedisClients(...clients: RedisClient[]) {
  const closeClient = (client: redis.RedisClient) => {
    return new Promise<void>((resolve, reject) =>
      client.quit((err) => (err ? reject(err) : resolve()))
    )
  }

  return Promise.all(clients.map((c) => closeClient(c)))
}
