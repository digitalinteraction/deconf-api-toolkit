import { Interpreter } from '@openlab/deconf-shared'
import { ApiError } from './api-error'

//
// Messages
//
interface SocketMessage<Name, Parameters> {
  name: Name
  parameters: Parameters
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
  | InterpreterTakeover
  | InterpreterStopped

export interface SocketService {
  emitToEveryone<T extends SocketMessages>(
    name: T['name'],
    ...parameters: T['parameters']
  ): void
  emitTo<T extends SocketMessages>(
    roomNameOrId: string,
    name: T['name'],
    ...parameters: T['parameters']
  ): void

  getRoomSize(roomName: string): Promise<number>
  getRoomSockets(roomName: string): Promise<string[]>
  joinRoom(socketId: string, roomName: string): void
  leaveRoom(socketId: string, roomName: string): void
  getSocketRooms(socketId: string): Promise<Set<string>>

  sendError(error: ApiError): void
}
