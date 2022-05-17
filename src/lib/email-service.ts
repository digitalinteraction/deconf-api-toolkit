import { MailService as Sendgrid } from '@sendgrid/mail'
import { MailData } from '@sendgrid/helpers/classes/mail'
import { DeconfBaseContext } from './context'
import { DeconfEnv } from './env'

type Context = {
  /** @deprecated use `mailConfig` */
  config: DeconfBaseContext['config']
  env: Pick<DeconfEnv, 'SENDGRID_API_KEY'>

  mailConfig?: {
    replyToEmail: string
    fromEmail: string
  }
}

/**
 * A service for sending html or transactional emails powered by Sendgrid.
 * It is setup to disable as much of Sendgrid's tracking as possible.
 *
 * ```ts
 * const env: { SENDGRID_API_KEY: string }
 * const mailConfig: {
 *   replyToEmail: string,
 *   fromEmail: string,
 * }
 *
 * const email = new EmailService({ env, mailConfig })
 * ```
 */
export class EmailService {
  get #mailOptions(): MailData {
    return {
      replyTo:
        this.#context.mailConfig?.replyToEmail ??
        this.#context.config.mail.replyToEmail,
      from:
        this.#context.mailConfig?.fromEmail ??
        this.#context.config.mail.fromEmail,
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking: { enable: false },
        subscriptionTracking: { enable: false },
        ganalytics: { enable: false },
      },
    }
  }

  #context: Context
  #mail = new Sendgrid()
  constructor(context: Context) {
    this.#context = context
    this.#mail.setApiKey(this.#context.env.SENDGRID_API_KEY)
  }

  /**
   * `sendEmail` dispatches an HTML-based email to be sent to an specific email address.
   *
   * ```ts
   * await email.sendEmail(
   *   'geoff@example.com',
   *   'Hi Geoff!',
   *   `<p> Welcome to your new account! </p>`
   * )
   * ```
   */
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.#mail.send({
      ...this.#mailOptions,
      to,
      subject,
      html,
    })
  }

  /**
   * `sendTransactional` dispatches a transaction email,
   * i.e. the template is setup on app.sendgrid.com
   * to be sent to a specific email address
   *
   * ```ts
   * await email.sendTransactional(
   *   'geoff@example.com',
   *   'Hi Geoff!',
   *   'd-abcdefghijklmnop',
   *   {
   *     firstName: 'Geoff',
   *     body: 'Welcome to your new account!',
   *     action: 'Log in',
   *     href: 'https://example.com/login',
   *   }
   * )
   * ```
   */
  async sendTransactional(
    to: string,
    subject: string,
    templateId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await this.#mail.send({
      ...this.#mailOptions,
      to,
      subject,
      templateId: templateId,
      dynamicTemplateData: {
        subject,
        ...data,
      },
      hideWarnings: true,
    })
  }
}
