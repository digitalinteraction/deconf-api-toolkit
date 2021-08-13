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

type SocketMessages =
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

  getRoomSize(roomNameOrId: string): Promise<number>
  joinRoom(socketId: string, roomName: string): void
  leaveRoom(socketId: string, roomName: string): void
  getSocketRooms(socketId: string): Promise<Set<string>>

  sendError(error: ApiError): void
}
