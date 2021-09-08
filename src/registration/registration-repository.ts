import { RegisterRequest, Registration } from '@openlab/deconf-shared'
import { DeconfBaseContext } from '../lib/context'

//
// TODO:
// - these queries could be optimised to suit registration-routes more
// - "userData" should never have been camel case, sorry
//

type Context = Pick<DeconfBaseContext, 'postgres'>

export class RegistrationRepository {
  get #postgres() {
    return this.#context.postgres
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  getRegistrations(email: string): Promise<Registration[]> {
    return this.#postgres.run((client) => {
      return client.sql`
        SELECT id, created, name, email, language, country, affiliation, verified, consented, "userData"
        FROM attendees
        WHERE email = ${email.toLowerCase()}
        ORDER BY created DESC
      `
    })
  }

  getVerifiedRegistration(id: number): Promise<Registration | null> {
    return this.#postgres.run(async (client) => {
      // get all registrations for that email, newest first
      const matches = await client.sql<Registration>`
        SELECT id, created, name, email, language, country, affiliation, verified, consented, "userData"
        FROM attendees
        WHERE id = ${id} AND verified = ${true}
        ORDER BY created DESC
      `
      return matches[0] ?? null
    })
  }

  register(request: RegisterRequest): Promise<void> {
    const { name, email, language, country, affiliation, userData } = request
    return this.#postgres.run(async (client) => {
      await client.sql`
        INSERT INTO attendees (name, email, language, country, affiliation, "userData")
        VALUES (${name}, ${email.toLowerCase()}, ${language}, ${country}, ${affiliation}, ${userData})
      `
    })
  }

  unregister(email: string): Promise<void> {
    return this.#postgres.run(async (client) => {
      await client.sql`
        DELETE FROM attendees
        WHERE email=${email}
      `
    })
  }

  verifyRegistration(id: number): Promise<void> {
    return this.#postgres.run(async (client) => {
      await client.sql`
        UPDATE attendees
        SET verified = ${true}
        WHERE id = ${id}
      `
    })
  }
}
