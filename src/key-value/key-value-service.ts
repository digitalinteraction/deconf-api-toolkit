export interface KeyValueService {
  retrieve<T>(key: string): Promise<T | null>
  put<T>(key: string, value: T): Promise<void>
  checkHealth(): Promise<void>
  setExpiry(key: string, duractionInSeconds: number): Promise<void>
  delete(key: string): Promise<void>
  close(): Promise<void>
}
