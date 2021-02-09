import { PostgresService, PostgresClient } from './postgres-service'
import {
  Registration,
  RegisterRequest,
  Attendance,
} from '@openlab/deconf-shared'

// NOTE: This is a bit of a behemoth, handling most postgres logic

interface SessionAttendance {
  session: string
  count: number
}
interface CountryCount {
  country: string
  count: number
}

/**
 * A service for retrieving registered users
 */
export interface QueryService {
  findRegistrations(email: string): Promise<Registration[]>
  getVerifiedRegistration(id: number): Promise<Registration | null>
  register(registration: RegisterRequest): Promise<void>
  unregister(email: string): Promise<void>
  verify(id: number): Promise<void>
  compareEmails(a: string, b: string): boolean
  attend(attendee: number, session: string): Promise<void>
  unattend(attendee: number, session: string): Promise<void>
  getSessionAttendance(): Promise<Map<string, number>>
  getUserAttendance(attendee: number): Promise<Attendance[]>
  getCountryCount(): Promise<CountryCount[]>
}

export function compareEmails(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase()
}

export async function findRegistrations(client: PostgresClient, email: string) {
  return client.sql<Registration>`
    SELECT id, created, name, email, language, country, affiliation, verified, consented
    FROM attendees
    WHERE email = ${email.toLowerCase()}
    ORDER BY created DESC
  `
}

export async function getVerifiedRegistration(
  client: PostgresClient,
  id: number
) {
  // get all registrations for that email, newest first
  const matches = await client.sql<Registration>`
    SELECT id, created, name, email, language, country, affiliation, verified, consented
    FROM attendees
    WHERE id = ${id} AND verified = ${true}
    ORDER BY created DESC
  `

  return matches[0] ?? null
}

async function addRegistration(client: PostgresClient, r: RegisterRequest) {
  const { name, email, language, country, affiliation } = r

  await client.sql`
    INSERT INTO attendees (name, email, language, country, affiliation)
    VALUES (${name}, ${email.toLowerCase()}, ${language}, ${country}, ${affiliation})
  `
}

async function verifyRegistration(client: PostgresClient, id: number) {
  await client.sql`
    UPDATE attendees
    SET verified = ${true}
    WHERE id = ${id}
  `
}

async function attend(
  client: PostgresClient,
  attendee: number,
  session: string
) {
  //
  // Check previous attendance
  //
  const result = await client.sql<Attendance>`
    SELECT FROM attendance
    WHERE attendee=${attendee} AND session=${session}
  `

  if (result.length > 0) return

  await client.sql`
    INSERT INTO attendance (attendee, session)
    VALUES (${attendee}, ${session})
  `
}

async function unattend(
  client: PostgresClient,
  attendee: number,
  session: string
) {
  await client.sql`
    DELETE FROM attendance
    WHERE attendee=${attendee} AND session=${session}
  `
}

async function getSessionAttendance(client: PostgresClient) {
  const records = await client.sql<SessionAttendance>`
    SELECT session, count(*) as count
    FROM attendance
    GROUP BY session;
  `
  const map = new Map<string, number>()

  for (const r of records) {
    map.set(r.session, r.count)
  }

  return map
}

async function getUserAttendance(client: PostgresClient, attendee: number) {
  return await client.sql<Attendance>`
    SELECT id, created, attendee, session
    FROM attendance
    WHERE attendee=${attendee}
  `
}

async function unregister(client: PostgresClient, email: string) {
  await client.sql`
    DELETE FROM attendees
    WHERE email=${email}
  `
}

async function getCountryCount(client: PostgresClient) {
  return client.sql<CountryCount>`
    SELECT country, count(*) as count
    FROM attendees
    GROUP BY country
    ORDER BY count DESC;
  `
}

export function createQueryService(pg: PostgresService): QueryService {
  return {
    findRegistrations: (email) => pg.run((c) => findRegistrations(c, email)),
    getVerifiedRegistration: (id) =>
      pg.run((c) => getVerifiedRegistration(c, id)),
    register: (r) => pg.run((c) => addRegistration(c, r)),
    unregister: (e) => pg.run((c) => unregister(c, e)),
    verify: (id) => pg.run((c) => verifyRegistration(c, id)),
    compareEmails,
    attend: (a, s) => pg.run((c) => attend(c, a, s)),
    unattend: (a, s) => pg.run((c) => unattend(c, a, s)),
    getSessionAttendance: () => pg.run((c) => getSessionAttendance(c)),
    getUserAttendance: (a) => pg.run((c) => getUserAttendance(c, a)),
    getCountryCount: () => pg.run((c) => getCountryCount(c)),
  }
}
