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

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.#mail.send({
      ...this.#mailOptions,
      to,
      subject,
      html,
    })
  }

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
