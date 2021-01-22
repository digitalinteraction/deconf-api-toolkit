export interface EmailService {
  sendLoginEmail(to: string, loginToken: string, locale: string): Promise<void>
}
