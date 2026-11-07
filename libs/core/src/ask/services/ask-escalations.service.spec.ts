import type { AskEscalation } from '@crossmart/database';
import type { AskCaller } from '../entities/ask-caller.js';
import { AskCallerType } from '../enums/ask-caller-type.enum.js';
import { AskEscalationReason } from '../enums/ask-escalation-reason.enum.js';
import { AskEscalationStatus } from '../enums/ask-escalation-status.enum.js';
import {
  AskEscalationAlreadyRepliedError,
  AskEscalationNotFoundError,
} from '../errors/ask.errors.js';
import type { AskEscalationRepository } from '../repositories/ask-escalation.repository.js';
import { tokenHash } from '../rules/ask-tokens.js';
import type { AskCallerKeys } from './ask-caller-keys.js';
import type { AskEscalationIntake } from './ask-escalation.intake.js';
import type { AskEscalationNotifier } from './ask-escalation.notifier.js';
import { AskEscalationsService } from './ask-escalations.service.js';

const CALLER = { ownerKey: 'owner', type: AskCallerType.Anonymous } as AskCaller;
const CONVERSATION = {
  id: 'conversation-1',
  publicId: 'conv_one',
  turns: [{ escalationReason: null }, { escalationReason: AskEscalationReason.Sales }],
};
const ESCALATION: AskEscalation = {
  id: 'escalation-1',
  conversationId: CONVERSATION.id,
  tokenHash: 'hash',
  reason: AskEscalationReason.Sales,
  status: AskEscalationStatus.Open,
  contactEmail: null,
  callbackUrl: null,
  reply: null,
  repliedAt: null,
  repliedBy: null,
  callbackDeliveredAt: null,
  callbackError: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function setup(callbackUrl: string | null = 'https://agent.example/cb') {
  const escalations = {
    create: vi.fn((data: Partial<AskEscalation>) => Promise.resolve({ ...ESCALATION, ...data })),
    findByTokenHash: vi.fn().mockResolvedValue(ESCALATION),
    findById: vi.fn().mockResolvedValue(ESCALATION),
    saveReply: vi.fn().mockResolvedValue(true),
    list: vi.fn().mockResolvedValue([ESCALATION]),
  };
  const intake = {
    admit: vi.fn().mockResolvedValue({ conversation: CONVERSATION, callbackUrl }),
    requireConversation: vi.fn().mockResolvedValue(CONVERSATION),
  };
  const keys = { callbackSecret: vi.fn().mockReturnValue('whsec_derived') };
  const notifier = { teamNeeded: vi.fn(), replied: vi.fn().mockResolvedValue(undefined) };
  const service = new AskEscalationsService(
    escalations as unknown as AskEscalationRepository,
    intake as unknown as AskEscalationIntake,
    keys as unknown as AskCallerKeys,
    notifier as unknown as AskEscalationNotifier,
  );
  return { service, escalations, notifier };
}

describe('AskEscalationsService', () => {
  it('opens a ticket on the caller’s conversation, stores only its hash, and tells the team', async () => {
    const { service, escalations, notifier } = setup();

    const opened = await service.open({ conversationId: 'conv_one' }, CALLER);

    expect(opened.id).toMatch(/^esc_/);
    expect(opened.callbackSecret).toBe('whsec_derived');
    const [created] = escalations.create.mock.calls[0];
    expect(created).toMatchObject({
      tokenHash: tokenHash(opened.id),
      reason: AskEscalationReason.Sales,
      callbackUrl: 'https://agent.example/cb',
    });
    expect(JSON.stringify(created)).not.toContain(opened.id);
    expect(notifier.teamNeeded).toHaveBeenCalled();
  });

  it('gives no callback secret without a callback URL', async () => {
    const opened = await setup(null).service.open({ conversationId: 'conv_one' }, CALLER);

    expect(opened.callbackSecret).toBeNull();
  });

  it('finds a ticket only by its id', async () => {
    const { service, escalations } = setup();
    escalations.findByTokenHash.mockResolvedValueOnce(null);

    await expect(service.ticket('esc_unknown')).rejects.toThrow(AskEscalationNotFoundError);
    expect(await service.ticket('esc_known')).toMatchObject({
      id: 'esc_known',
      status: AskEscalationStatus.Open,
    });
  });

  it('stores a reply once and sends it to the asker', async () => {
    const { service, escalations, notifier } = setup();

    await service.reply({ escalationId: ESCALATION.id, reply: 'Hello', repliedBy: 'admin@x.io' });
    escalations.saveReply.mockResolvedValueOnce(false);

    expect(notifier.replied).toHaveBeenCalledWith(ESCALATION, CONVERSATION.publicId);
    await expect(
      service.reply({ escalationId: ESCALATION.id, reply: 'Again', repliedBy: 'admin@x.io' }),
    ).rejects.toThrow(AskEscalationAlreadyRepliedError);
  });
});
