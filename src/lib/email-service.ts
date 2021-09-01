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

interface Context extends Pick<DeconfBaseContext, 'env' | 'config'> {}

export class EmailService {
  get #env() {
    return this.#context.env
  }
  get #mailConfig() {
    return this.#context.config.mail
  }

  #mail = new Sendgrid()
  #context: Context

  constructor(context: Context) {
    this.#context = context
    this.#mail.setApiKey(this.#env.SENDGRID_API_KEY)
  }

  async sendEmail(to: string, subject: string, html: string) {
    await this.#mail.send({
      to,
      subject,
      html,
      replyTo: this.#mailConfig.replyToEmail,
      from: this.#mailConfig.fromEmail,
      ...TRACKING_SETTINGS,
    })
  }
}
