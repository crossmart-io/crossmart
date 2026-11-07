import type { AppConfigService } from '@crossmart/common';
import { AiNotConfiguredError } from '../../ai/errors/ai.errors.js';
import type { AiGateway } from '../../ai/services/ai-gateway.service.js';
import type { AskCaller } from '../entities/ask-caller.js';
import type { AskRequest } from '../entities/ask-request.js';
import type { ComposedAnswer } from '../entities/composed-answer.js';
import { AskCallerType } from '../enums/ask-caller-type.enum.js';
import { AskChannel } from '../enums/ask-channel.enum.js';
import { AskConfidence } from '../enums/ask-confidence.enum.js';
import { AskEscalationReason } from '../enums/ask-escalation-reason.enum.js';
import { AskOutcome } from '../enums/ask-outcome.enum.js';
import { AskTurnedOffError } from '../errors/ask.errors.js';
import type { AskAnswerer } from './ask-answerer.js';
import type { AskConversationsService, OpenedConversation } from './ask-conversations.service.js';
import { AskService } from './ask.service.js';

const ANONYMOUS: AskCaller = {
  type: AskCallerType.Anonymous,
  ownerKey: 'owner',
  clientFingerprint: 'fingerprint',
  clientName: null,
  userId: null,
  workspace: null,
};
const COMPOSED: ComposedAnswer = {
  answer: {
    outcome: AskOutcome.Unknown,
    answer: 'I don’t know.',
    citations: [],
    confidence: AskConfidence.Low,
    handoff: true,
    supportEmail: 'help@example.com',
  },
  model: 'fake-model',
  cached: false,
  lookups: [],
  asksForPerson: false,
  salesInquiry: false,
};
const EXISTING = {
  existing: {
    id: 'conversation-1',
    publicId: 'conv_existing',
    ownerKey: 'owner',
    turnCount: 1,
    lastActivityAt: new Date(),
    escalatedAt: null,
    channel: AskChannel.Api,
  },
  history: [{ question: 'earlier', answer: 'answer' }],
} satisfies OpenedConversation;

function setup(opened: OpenedConversation = { existing: null, history: [] }, cap = 10) {
  const ai = { assertConfigured: vi.fn() };
  const answerer = { answer: vi.fn().mockResolvedValue(COMPOSED) };
  const conversations = {
    open: vi.fn().mockResolvedValue(opened),
    record: vi.fn().mockResolvedValue({ conversationId: 'conv_new', turnId: 'turn-1' }),
  };
  const config = { askSettings: { dailyQuestionCap: cap } } as AppConfigService;
  const service = new AskService(
    ai as unknown as AiGateway,
    answerer as unknown as AskAnswerer,
    conversations as unknown as AskConversationsService,
    config,
  );
  return { service, ai, answerer, conversations };
}

const request = (overrides: Partial<AskRequest> = {}): AskRequest => ({
  question: 'Does Crossmart support Amazon?',
  channel: AskChannel.Api,
  caller: ANONYMOUS,
  ...overrides,
});

describe('AskService', () => {
  it('answers, stores the turn and returns the conversation with an offer of a person', async () => {
    const { service, conversations } = setup();

    const reply = await service.ask(request());

    expect(reply).toMatchObject({
      outcome: AskOutcome.Unknown,
      conversationId: 'conv_new',
      turnId: 'turn-1',
      escalation: { offered: true, reason: AskEscalationReason.Unanswered },
    });
    const [, , outcome] = conversations.record.mock.calls[0];
    expect(outcome.latencyMs).toBeGreaterThanOrEqual(0);
    expect(outcome.offer.reason).toBe(AskEscalationReason.Unanswered);
  });

  it('uses the cache only for an anonymous caller’s first question', async () => {
    const first = setup();
    await first.service.ask(request());
    expect(first.answerer.answer.mock.calls[0][0].cacheable).toBe(true);

    const followUp = setup(EXISTING);
    await followUp.service.ask(request({ conversationId: 'conv_existing' }));
    expect(followUp.answerer.answer.mock.calls[0][0]).toMatchObject({
      cacheable: false,
      history: EXISTING.history,
    });

    const user = setup();
    await user.service.ask(request({ caller: { ...ANONYMOUS, type: AskCallerType.User } }));
    expect(user.answerer.answer.mock.calls[0][0].cacheable).toBe(false);
  });

  it('is off when the cap is 0, and unavailable while AI is not configured', async () => {
    await expect(setup(undefined, 0).service.ask(request())).rejects.toThrow(AskTurnedOffError);

    const { service, ai, conversations } = setup();
    ai.assertConfigured.mockImplementation(() => {
      throw new AiNotConfiguredError();
    });
    await expect(service.ask(request())).rejects.toThrow(AiNotConfiguredError);
    expect(conversations.record).not.toHaveBeenCalled();
  });
});
