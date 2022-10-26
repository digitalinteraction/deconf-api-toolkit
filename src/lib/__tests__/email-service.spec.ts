import { MailService as Sendgrid } from '@sendgrid/mail'

import { jest, mocked } from '../../test-lib/module.js'
import { createTestingDeconfConfig } from '../config.js'
import { createTestingEnv } from '../env.js'
import { EmailService } from '../email-service.js'

jest.mock('@sendgrid/mail')

function setup() {
  mocked(Sendgrid).mockClear()
  const env = createTestingEnv()
  const config = createTestingDeconfConfig()
  const service = new EmailService({ env, config })
  const sendgrid = mocked(Sendgrid).mock.instances[0]
  return { env, config, service, sendgrid }
}

it('should pass', async () => {
  expect(1 + 1).toEqual(2)
})

//
// TODO: re-write when jest mock w/ ESM is stable
//
// describe('EmailService', () => {
//   describe('sendEmail', () => {
//     it('should send them email', async () => {
//       const { service, sendgrid, config } = setup()

//       await service.sendEmail('geoff@example.com', 'Hi', '<p>Hello</p>')

//       expect(sendgrid.send).toBeCalledWith(
//         expect.objectContaining({
//           to: 'geoff@example.com',
//           subject: 'Hi',
//           html: '<p>Hello</p>',
//           replyTo: config.mail.replyToEmail,
//           from: config.mail.fromEmail,
//         })
//       )
//     })
//     it('should disable all tracking', async () => {
//       const { service, sendgrid } = setup()

//       await service.sendEmail('geoff@example.com', 'Hi', '<p>Hello</p>')

//       expect(sendgrid.send).toBeCalledWith(
//         expect.objectContaining({
//           trackingSettings: {
//             clickTracking: { enable: false },
//             openTracking: { enable: false },
//             subscriptionTracking: { enable: false },
//             ganalytics: { enable: false },
//           },
//         })
//       )
//     })
//   })
// })
