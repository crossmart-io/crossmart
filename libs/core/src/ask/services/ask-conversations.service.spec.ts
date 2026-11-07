import type { AskTurn } from '@crossmart/database';
import { ASK_CONVERSATION_IDLE_MS, ASK_CONVERSATION_MAX_TURNS } from '../ask.constants.js';
import type { AskCaller } from '../entities/ask-caller.js';
import type { ComposedAnswer } from '../entities/composed-answer.js';
import { AskCallerType } from '../enums/ask-caller-type.enum.js';
import { AskChannel } from '../enums/ask-channel.enum.js';
import { AskConfidence } from '../enums/ask-confidence.enum.js';
import { AskOutcome } from '../enums/ask-outcome.enum.js';
import { AskConversationFullError, AskConversationNotFoundError } from '../errors/ask.errors.js';
import type {
  AskConversationRepository,
  AskConversationRow,
} from '../repositories/ask-conversation.repository.js';
import { AskConversationsService } from './ask-conversations.service.js';

const NOW = new Date('2026-11-07T12:00:00Z');
const CALLER: AskCaller = {
  type: AskCallerType.Anonymous,
  ownerKey: 'a'.repeat(64),
  clientFingerprint: 'f'.repeat(64),
  clientName: null,
  userId: null,
  workspace: null,
};
const ROW: AskConversationRow = {
  id: 'conversation-1',
  publicId: 'conv_one',
  ownerKey: CALLER.ownerKey,
  turnCount: 1,
  lastActivityAt: new Date(NOW.getTime() - 60_000),
  escalatedAt: null,
  channel: AskChannel.Api,
};
const COMPOSED: ComposedAnswer = {
  answer: {
    outcome: AskOutcome.Answered,
    answer: 'Write to jane@example.com.',
    citations: [{ title: 'Keys', url: 'https://docs.example/keys' }],
    confidence: AskConfidence.High,
    handoff: false,
    supportEmail: 'help@example.com',
  },
  model: 'fake-model',
  cached: false,
  lookups: [],
  asksForPerson: false,
  salesInquiry: false,
};

function setup(row: AskConversationRow | null = ROW) {
  const repository = {
    findByPublicId: vi.fn().mockResolvedValue(row),
    recentTurns: vi.fn().mockResolvedValue([{ question: 'earlier', answer: 'answer' }]),
    create: vi.fn().mockResolvedValue({ ...ROW, id: 'new', publicId: 'conv_new', turnCount: 0 }),
    appendTurn: vi.fn().mockResolvedValue({ id: 'turn-1' } as AskTurn),
  };
  const service = new AskConversationsService(repository as unknown as AskConversationRepository);
  return { service, repository };
}

const request = (conversationId?: string) => ({
  question: 'My key cm_0123456789abcdefXYZ fails',
  conversationId,
  channel: AskChannel.WebWidget,
  caller: CALLER,
});

describe('AskConversationsService', () => {
  it('opens nothing for a first question', async () => {
    const { service, repository } = setup();

    expect(await service.open(request(), NOW)).toEqual({ existing: null, history: [] });
    expect(repository.findByPublicId).not.toHaveBeenCalled();
  });

  it('continues the caller’s live conversation with its recent turns', async () => {
    const { service } = setup();

    const opened = await service.open(request('conv_one'), NOW);

    expect(opened.existing).toEqual(ROW);
    expect(opened.history).toEqual([{ question: 'earlier', answer: 'answer' }]);
  });

  it('answers 404 alike for an unknown, someone else’s or an expired conversation', async () => {
    const expired = { ...ROW, lastActivityAt: new Date(NOW.getTime() - ASK_CONVERSATION_IDLE_MS) };
    for (const row of [null, { ...ROW, ownerKey: 'b'.repeat(64) }, expired]) {
      await expect(setup(row).service.open(request('conv_one'), NOW)).rejects.toThrow(
        AskConversationNotFoundError,
      );
    }
  });

  it('refuses a conversation that is full', async () => {
    const full = { ...ROW, turnCount: ASK_CONVERSATION_MAX_TURNS };

    await expect(setup(full).service.open(request('conv_one'), NOW)).rejects.toThrow(
      AskConversationFullError,
    );
  });

  it('starts the conversation on its first turn and stores the turn redacted', async () => {
    const { service, repository } = setup();

    const recorded = await service.record(
      request(),
      { existing: null, history: [] },
      { composed: COMPOSED, offer: { offered: false, reason: null }, latencyMs: 42 },
      NOW,
    );

    expect(recorded).toEqual({ conversationId: 'conv_new', turnId: 'turn-1' });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: AskChannel.WebWidget,
        callerType: AskCallerType.Anonymous,
        ownerKey: CALLER.ownerKey,
        clientFingerprint: CALLER.clientFingerprint,
      }),
    );
    const [, turn] = repository.appendTurn.mock.calls[0];
    expect(turn).toMatchObject({
      question: 'My key [redacted] fails',
      answer: 'Write to [redacted].',
      outcome: AskOutcome.Answered,
      latencyMs: 42,
      model: 'fake-model',
    });
    expect(turn.questionHash).toMatch(/^[0-9a-f]{64}$/);
  });
});
