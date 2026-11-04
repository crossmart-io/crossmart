import { Logger } from '@nestjs/common';
import { LogMailSender } from './log-mail-sender.js';

const MESSAGE = {
  to: 'ana@example.com',
  subject: 'Reset your Crossmart password',
  html: '<p>x</p>',
  text: 'Choose a new password: https://api.example.com/reset/secret-token',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LogMailSender', () => {
  it('logs the whole email in development, links included', async () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    await new LogMailSender(true).send(MESSAGE);
    expect(log.mock.calls[0]?.[0]).toContain('secret-token');
  });

  it('never logs the body, and its links, in production', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    await new LogMailSender(false).send(MESSAGE);
    expect(String(warn.mock.calls[0]?.[0])).not.toContain('secret-token');
    expect(String(warn.mock.calls[0]?.[0])).not.toContain('ana@example.com');
  });
});
