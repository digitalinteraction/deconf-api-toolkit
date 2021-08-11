export interface KeyValueService {
  retrieve<T>(key: string): Promise<T | null>
  store(key: string, value: any): Promise<void>
  checkHealth(): Promise<void>
  setExpiry(key: string, duractionInSeconds: number): Promise<void>
  delete(key: string): Promise<void>
  close(): Promise<void>
}
