import { Interpreter } from '@openlab/deconf-shared'
import { ApiError } from './api-error'

//
// Messages
//
interface SocketMessage<Name, Parameters extends unknown[]> {
  emitParams: [Name, ...Parameters]
}

type SocketError = SocketMessage<'socket-error', [ApiError]>
type SiteVisitors = SocketMessage<'site-visitors', [number]>

type ChannelOccupancy = SocketMessage<'channel-occupancy', [number]>
type ChannelStarted = SocketMessage<'channel-started', []>
type ChannelData = SocketMessage<'channel-data', [Buffer]>
type ChannelStopped = SocketMessage<'channel-stopped', []>

type InterpreterAccepted = SocketMessage<'interpreter-accepted', [Interpreter]>
type InterpreterJoined = SocketMessage<'interpreter-joined', [Interpreter]>
type InterpreterLeft = SocketMessage<'interpreter-left', [Interpreter]>
type InterpreterMessage = SocketMessage<
  'interpreter-message',
  [Interpreter, string]
>
type InterpreterStarted = SocketMessage<'interpreter-started', [Interpreter]>
type InterpreterRequested = SocketMessage<
  'interpreter-requested',
  [Interpreter, number]
>
type InterpreterTakeover = SocketMessage<'interpreter-takeover', [Interpreter]>
type InterpreterStopped = SocketMessage<'interpreter-stopped', [Interpreter]>

type SocketMessages =
  | SiteVisitors
  | ChannelOccupancy
  | ChannelStarted
  | ChannelData
  | ChannelStopped
  | InterpreterAccepted
  | InterpreterJoined
  | InterpreterLeft
  | InterpreterMessage
  | InterpreterStarted
  | InterpreterRequested
  | InterpreterTakeover
  | InterpreterStopped

export interface SocketService {
  emitToEveryone<T extends SocketMessages>(...parameters: T['emitParams']): void
  emitTo<T extends SocketMessages>(
    roomNameOrId: string,
    ...parameters: T['emitParams']
  ): void

  getRoomSize(roomName: string): Promise<number>
  getRoomSockets(roomName: string): Promise<string[]>
  joinRoom(socketId: string, roomName: string): void
  leaveRoom(socketId: string, roomName: string): void
  getSocketRooms(socketId: string): Promise<Set<string>>

  sendError(error: ApiError): void
}