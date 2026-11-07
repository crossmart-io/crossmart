import type { AppConfigService } from '@crossmart/common';
import type { AskEscalation } from '@crossmart/database';
import type { AskEmailsService } from '../../notifications/services/ask-emails.service.js';
import type { WebhookSender } from '../../webhooks/services/webhook-sender.js';
import { AskEscalationReason } from '../enums/ask-escalation-reason.enum.js';
import { AskEscalationStatus } from '../enums/ask-escalation-status.enum.js';
import type { AskEscalationRepository } from '../repositories/ask-escalation.repository.js';
import type { AskCallerKeys } from './ask-caller-keys.js';
import { AskEscalationCallback } from './ask-escalation.callback.js';
import { AskEscalationNotifier } from './ask-escalation.notifier.js';

const REPLIED: AskEscalation = {
  id: 'escalation-1',
  conversationId: 'conversation-1',
  tokenHash: 'hash',
  reason: AskEscalationReason.Unanswered,
  status: AskEscalationStatus.Replied,
  contactEmail: 'owner@example.com',
  callbackUrl: 'https://agent.example/cb',
  reply: 'Here is how.',
  repliedAt: new Date(),
  repliedBy: 'admin@example.com',
  callbackDeliveredAt: null,
  callbackError: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function setup(succeeded = true) {
  const emails = { sendEscalationOpened: vi.fn(), sendEscalationReply: vi.fn() };
  const sender = {
    send: vi.fn().mockResolvedValue({
      succeeded,
      responseStatus: succeeded ? 200 : 500,
      durationMs: 5,
      error: succeeded ? null : 'error_status 500',
    }),
  };
  const repository = { saveCallbackResult: vi.fn().mockResolvedValue(undefined) };
  const callback = new AskEscalationCallback(
    sender as unknown as WebhookSender,
    repository as unknown as AskEscalationRepository,
    { callbackSecret: () => 'whsec_test' } as unknown as AskCallerKeys,
  );
  const notifier = new AskEscalationNotifier(emails as unknown as AskEmailsService, callback, {
    askSettings: { escalationEmail: 'team@example.com' },
    webAppUrl: 'https://app.example',
  } as AppConfigService);
  return { notifier, emails, sender, repository };
}

describe('AskEscalationNotifier', () => {
  it('emails the team the whole conversation with a link to it', () => {
    const { notifier, emails } = setup();

    notifier.teamNeeded(REPLIED, {
      id: 'conversation-1',
      channel: 'api',
      callerType: 'anonymous',
      clientName: null,
      turns: [{ question: 'Q', answer: 'A', outcome: 'unknown' }],
    } as never);

    expect(emails.sendEscalationOpened).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'team@example.com',
        url: 'https://app.example/admin/ask/conversation-1',
        contactEmail: 'owner@example.com',
      }),
    );
  });

  it('emails the reply and posts it signed to the callback, storing the outcome', async () => {
    const { notifier, emails, sender, repository } = setup();

    await notifier.replied(REPLIED, 'conv_one');

    expect(emails.sendEscalationReply).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'owner@example.com', reply: 'Here is how.' }),
    );
    expect(sender.send.mock.calls[0][0].url).toBe('https://agent.example/cb');
    expect(sender.send.mock.calls[0][0].headers['Crossmart-Signature']).toMatch(/^t=\d+,v1=/);
    expect(repository.saveCallbackResult).toHaveBeenCalledWith(REPLIED.id, {
      callbackDeliveredAt: expect.any(Date),
      callbackError: null,
    });
  });

  it('stores why a callback failed', async () => {
    const { notifier, repository } = setup(false);

    await notifier.replied(REPLIED, 'conv_one');

    expect(repository.saveCallbackResult).toHaveBeenCalledWith(REPLIED.id, {
      callbackDeliveredAt: null,
      callbackError: 'error_status 500',
    });
  });

  it('sends nothing before there is a reply', async () => {
    const { notifier, emails, sender } = setup();

    await notifier.replied({ ...REPLIED, reply: null, repliedAt: null }, 'conv_one');

    expect(emails.sendEscalationReply).not.toHaveBeenCalled();
    expect(sender.send).not.toHaveBeenCalled();
  });
});
