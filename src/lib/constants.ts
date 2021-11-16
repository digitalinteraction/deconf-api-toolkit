export interface VoidResponse {
  message: 'ok'
}

export const VOID_RESPONSE: VoidResponse = Object.seal({ message: 'ok' })
