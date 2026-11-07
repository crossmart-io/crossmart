import { BadRequestException } from '@nestjs/common';
import type { WebhookUrlPolicy } from '../../webhooks/services/webhook-url.policy.js';
import { ASK_ESCALATION_QUOTA_KEY_PREFIX, ASK_ESCALATIONS_PER_DAY } from '../ask.constants.js';
import type { AskCaller } from '../entities/ask-caller.js';
import {
  AskConversationNotFoundError,
  AskEscalationLimitReachedError,
} from '../errors/ask.errors.js';
import type { AskInsightsRepository } from '../repositories/ask-insights.repository.js';
import { InMemoryAskQuota } from '../testing/ask.fakes.js';
import type { AskConversationsService } from './ask-conversations.service.js';
import { AskEscalationIntake } from './ask-escalation.intake.js';

const CALLER = { ownerKey: 'owner' } as AskCaller;
const NOW = new Date();

function setup() {
  const conversations = { requireOwned: vi.fn().mockResolvedValue({ id: 'conversation-1' }) };
  const insights = {
    findConversation: vi.fn().mockResolvedValue({ id: 'conversation-1', turns: [] }),
  };
  const policy = { assertAllowed: vi.fn((url: string) => Promise.resolve(url)) };
  const quota = new InMemoryAskQuota();
  const intake = new AskEscalationIntake(
    conversations as unknown as AskConversationsService,
    insights as unknown as AskInsightsRepository,
    policy as unknown as WebhookUrlPolicy,
    quota,
  );
  return { intake, conversations, policy, quota };
}

describe('AskEscalationIntake', () => {
  it('admits the caller’s own conversation with a checked callback URL', async () => {
    const { intake, policy } = setup();

    const admitted = await intake.admit(
      { conversationId: 'conv_one', callbackUrl: 'https://agent.example/cb' },
      CALLER,
      NOW,
    );

    expect(admitted).toEqual({
      conversation: { id: 'conversation-1', turns: [] },
      callbackUrl: 'https://agent.example/cb',
    });
    expect(policy.assertAllowed).toHaveBeenCalledWith('https://agent.example/cb');
  });

  it('refuses someone else’s conversation', async () => {
    const { intake, conversations } = setup();
    conversations.requireOwned.mockRejectedValue(new AskConversationNotFoundError());

    await expect(intake.admit({ conversationId: 'conv_one' }, CALLER, NOW)).rejects.toThrow(
      AskConversationNotFoundError,
    );
  });

  it('refuses a callback URL the webhook SSRF policy refuses', async () => {
    const { intake, policy } = setup();
    policy.assertAllowed.mockRejectedValue(new BadRequestException('private_address'));

    await expect(
      intake.admit({ conversationId: 'conv_one', callbackUrl: 'http://10.0.0.1/' }, CALLER, NOW),
    ).rejects.toThrow(BadRequestException);
  });

  it(`stops a caller after ${ASK_ESCALATIONS_PER_DAY} escalations a day`, async () => {
    const { intake, quota } = setup();
    quota.taken.set(`${ASK_ESCALATION_QUOTA_KEY_PREFIX}owner`, ASK_ESCALATIONS_PER_DAY);

    await expect(intake.admit({ conversationId: 'conv_one' }, CALLER, NOW)).rejects.toThrow(
      AskEscalationLimitReachedError,
    );
  });
});
