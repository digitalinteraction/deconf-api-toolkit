import { MailService as Sendgrid } from '@sendgrid/mail'
import { DeconfBaseContext } from './context'

// Disable all sendgrid tracking
const TRACKING_SETTINGS = {
  trackingSettings: {
    clickTracking: { enable: false },
    openTracking: { enable: false },
    subscriptionTracking: { enable: false },
    ganalytics: { enable: false },
  },
}

type Context = Pick<DeconfBaseContext, 'env' | 'config'>

export class EmailService {
  get #env() {
    return this.#context.env
  }
  get #config() {
    return this.#context.config
  }

  #context: Context
  #mail = new Sendgrid()
  constructor(context: Context) {
    this.#context = context
    this.#mail.setApiKey(this.#env.SENDGRID_API_KEY)
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.#mail.send({
      to,
      subject,
      html,
      replyTo: this.#config.mail.replyToEmail,
      from: this.#config.mail.fromEmail,
      ...TRACKING_SETTINGS,
    })
  }

  async sendTransactional(
    to: string,
    subject: string,
    templateId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await this.#mail.send({
      to,
      subject,
      replyTo: this.#config.mail.replyToEmail,
      from: this.#config.mail.fromEmail,
      templateId: templateId,
      dynamicTemplateData: {
        subject,
        ...data,
      },
      hideWarnings: true,
    })
  }
}
