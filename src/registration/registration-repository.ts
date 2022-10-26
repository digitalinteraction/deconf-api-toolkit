import { RegisterRequest, Registration } from '@openlab/deconf-shared'
import { DeconfBaseContext } from '../lib/context.js'

//
// NOTES:
// - "userData" must be quoted in SQL queries
//

type Context = Pick<DeconfBaseContext, 'postgres'>

/**
 * RegistrationRepository is a repository that provides SQL queries
 * for registration.
 *
 * ```ts
 * const postgres: PostgresService
 *
 * const registrationRepo = new RegistrationRepository({ postgres })
 * ```
 */
export class RegistrationRepository {
  get #postgres() {
    return this.#context.postgres
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  /**
   * Get all the registrations attempts for a specific email address
   *
   * ```ts
   * const registrations = await registrationRepo.getRegistrations(
   *   'dalya@example.com'
   * )
   * ```
   */
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

  /**
   * Get the verified registration for an email address, or null if that email is not verified.
   *
   * ```ts
   * const verifiedRegistration = await registrationRepo.getVerifiedRegistration(
   *   'dalya@example.com'
   * )
   * ```
   */
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

  /**
   * Create an unverified registration.
   *
   * ```ts
   * await registrationRepo.register({
   *   name: 'Chloe Smith',
   *   email: 'chloe@example.com',
   *   language: 'EN',
   *   country: 'GB',
   *   affiliation: 'Open Lab',
   *   userData: { marketingConsent: false },
   * })
   * ```
   */
  register(request: RegisterRequest): Promise<void> {
    const { name, email, language, country, affiliation, userData } = request
    return this.#postgres.run(async (client) => {
      await client.sql`
        INSERT INTO attendees (name, email, language, country, affiliation, "userData")
        VALUES (${name}, ${email.toLowerCase()}, ${language}, ${country}, ${affiliation}, ${userData})
      `
    })
  }

  /**
   * Remove all registrations, verified and unverified, for an email address.
   *
   * ```ts
   * await registrationRepo.unregister('chloe@example.com')
   * ```
   */
  unregister(email: string): Promise<void> {
    return this.#postgres.run(async (client) => {
      await client.sql`
        DELETE FROM attendees
        WHERE email=${email}
      `
    })
  }

  /**
   * Mark a registration as verified, e.g. The user clicked verified in an email.
   *
   * ```ts
   * // It takes the id of the registration record to be verified
   * await registrationRepo.verifyRegistration(42)
   * ```
   */
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
