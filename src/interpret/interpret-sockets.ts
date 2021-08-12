import { Interpreter } from '@openlab/deconf-shared'
import { ApiError } from '../lib/api-error'

//
// Messages
//
interface SocketMessage<Name extends string, Parameters extends unknown[]> {
  args: [Name, ...Parameters]
}

type SocketError = SocketMessage<'socket-error', [ApiError]>
type SiteVisitors = SocketMessage<'site-visitors', [number]>

type ChannelOccupancy = SocketMessage<'channel-occupancy', [number]>
type ChannelStarted = SocketMessage<'channel-started', []>
type ChannelData = SocketMessage<'channel-data', [Buffer]>
type ChannelStopped = SocketMessage<'channel-stopped', []>

type InterpretAccepted = SocketMessage<'interpret-accepted', [Interpreter]>
type InterpretJoined = SocketMessage<'interpret-joined', [Interpreter]>
type InterpretLeft = SocketMessage<'interpret-left', [Interpreter]>
type InterpretMessage = SocketMessage<
  'interpret-message',
  [Interpreter, string]
>
type InterpretStarted = SocketMessage<'interpret-started', [Interpreter]>
type InterpretTakeover = SocketMessage<'interpret-takeover', [Interpreter]>
type InterpretStopped = SocketMessage<'interpret-stopped', [Interpreter]>

type AllMessage =
  | SocketError
  | SiteVisitors
  | ChannelOccupancy
  | ChannelStarted
  | ChannelData
  | ChannelStopped
  | InterpretAccepted
  | InterpretJoined
  | InterpretLeft
  | InterpretMessage
  | InterpretStarted
  | InterpretTakeover
  | InterpretTakeover
  | InterpretStopped

//
// Sockets
//

// interface SocketSocket {
//   id: string
//   onDisconnect(block: () => void): void
// }

interface SocketServer {
  emitToEveryone<T extends AllMessage>(...args: T['args']): void
  emitTo<T extends AllMessage>(roomNameOrId: string, ...args: T['args']): void

  getRoomSize(roomNameOrId: string): string
  joinRoom(socketId: string, roomName: string): void
  leaveRoom(socketId: string, roomName: string): void

  sendError(error: Error): void
}

interface InterpretBooth {
  sessionId: string
  channel: string
}

interface InterpretSockets {
  // Events
  socketConnected(socketId: string): void
  socketDisconnected(socketId: string): void

  // Channels
  joinChannel(socketId: string, booth: InterpretBooth): void
  leaveChannel(socketId: string, booth: InterpretBooth): void

  // Interpret
  acceptInterpret(socketId: string, booth: InterpretBooth): void
  joinBooth(socketId: string, booth: InterpretBooth): void
  leaveBooth(socketId: string, booth: InterpretBooth): void
  messageBooth(socketId: string, booth: InterpretBooth, message: string): void
  requestInterpret(
    socketId: string,
    booth: InterpretBooth,
    duration: number
  ): void
  sendAudio(socketId: string, rawData: Buffer): void
  startInterpret(socketId: string, booth: InterpretBooth): void
  stopInterpret(socketId: string, booth: InterpretBooth): void
}

// Maybe what auth sockets could be like
interface AuthSockets {
  auth(socketId: string, token: string): void
  deauth(socketId: string, token: string): void
}

// Maybe what analytics sockets could be like
interface AnalyticsSockets {
  online(socketId: string): void
  event(socketId: string, eventName: string, payload: any): void
  error(socketId: string, error: Error): void
}
