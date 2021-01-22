import { ConferenceService } from '../conference-service'

export function mockConferenceService(): ConferenceService {
  return {
    getSlots: jest.fn(),
    getSessions: jest.fn(),
    findSession: jest.fn(),
    getTracks: jest.fn(),
    getThemes: jest.fn(),
    getSpeakers: jest.fn(),
    getTypes: jest.fn(),
    getSettings: jest.fn(),
    getInterpreters: jest.fn(),
    findInterpreter: jest.fn(),
  }
}
