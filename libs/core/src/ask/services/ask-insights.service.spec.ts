import { NotFoundException } from '@nestjs/common';
import type { AskConversation } from '@crossmart/database';
import { AskCallerType } from '../enums/ask-caller-type.enum.js';
import { AskChannel } from '../enums/ask-channel.enum.js';
import { AskConfidence } from '../enums/ask-confidence.enum.js';
import { AskOutcome } from '../enums/ask-outcome.enum.js';
import type { AskInsightsRepository } from '../repositories/ask-insights.repository.js';
import { AskInsightsService } from './ask-insights.service.js';

const AT = new Date('2026-11-07T10:00:00Z');
const conversation = (id: string, turnCount: number): AskConversation => ({
  id,
  publicId: `conv_${id}`,
  channel: AskChannel.Api,
  callerType: AskCallerType.Anonymous,
  clientName: null,
  ownerKey: 'owner',
  clientFingerprint: 'fingerprint',
  workspaceId: null,
  userId: null,
  turnCount,
  lastActivityAt: AT,
  escalatedAt: null,
  createdAt: AT,
});

function setup() {
  const repository = {
    listConversations: vi.fn().mockResolvedValue({
      records: [conversation('c1', 2), conversation('c2', 1), conversation('c3', 1)],
      total: 3,
    }),
    endTurns: vi.fn().mockResolvedValue([
      { conversationId: 'c1', position: 1, question: 'first of c1', outcome: AskOutcome.Answered },
      { conversationId: 'c1', position: 2, question: 'last of c1', outcome: AskOutcome.Unknown },
      { conversationId: 'c2', position: 1, question: 'only of c2', outcome: AskOutcome.OutOfScope },
    ]),
    findConversation: vi.fn().mockResolvedValue(null),
    questionCounts: vi.fn().mockResolvedValue([]),
  };
  return {
    service: new AskInsightsService(repository as unknown as AskInsightsRepository),
    repository,
  };
}

describe('AskInsightsService', () => {
  it('lists conversations with their first question and latest outcome, one page at a time', async () => {
    const { service } = setup();

    const page = await service.conversations({ limit: 2 });

    expect(page.total).toBe(3);
    expect(page.nextCursor).toBe('c2');
    expect(page.items).toEqual([
      expect.objectContaining({
        id: 'c1',
        firstQuestion: 'first of c1',
        lastOutcome: AskOutcome.Unknown,
      }),
      expect.objectContaining({
        id: 'c2',
        firstQuestion: 'only of c2',
        lastOutcome: AskOutcome.OutOfScope,
      }),
    ]);
  });

  it('answers 404 for a conversation that is not there', async () => {
    await expect(setup().service.conversation('missing')).rejects.toThrow(NotFoundException);
  });

  it('counts unanswered questions as unknown or low-confidence answers', async () => {
    const { service, repository } = setup();

    await service.unansweredQuestions({ limit: 10 });
    await service.topQuestions({ limit: 10 });

    expect(repository.questionCounts).toHaveBeenNthCalledWith(
      1,
      { OR: [{ outcome: AskOutcome.Unknown }, { confidence: AskConfidence.Low }] },
      { limit: 10 },
    );
    expect(repository.questionCounts).toHaveBeenNthCalledWith(2, {}, { limit: 10 });
  });
});
