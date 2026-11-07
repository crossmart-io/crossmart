import {
  AskConfidence,
  AskEscalationReason,
  AskEscalationStatus,
  AskOutcome,
} from '@crossmart/core';
import { A2aRole } from '../enums/a2a-role.enum.js';
import { A2aTaskState } from '../enums/a2a-task-state.enum.js';
import { answeredTask, escalationTask } from './a2a-task.mapper.js';

const TURN = {
  taskId: 'turn-1',
  contextId: 'conv_one',
  question: 'Does it support Etsy?',
  answer: 'Etsy is in development.',
  outcome: AskOutcome.Answered,
  confidence: AskConfidence.Medium,
  citations: [{ title: 'Channels', url: 'https://crossmart.io/#channels' }],
  escalationReason: null,
  at: new Date('2026-11-07T10:00:00Z'),
};

describe('A2A task mapping', () => {
  it('maps an answer to a completed task with the answer as text and data', () => {
    const task = answeredTask(TURN, { includeArtifacts: true });

    expect(task).toMatchObject({
      id: 'turn-1',
      contextId: 'conv_one',
      status: { state: A2aTaskState.Completed, timestamp: '2026-11-07T10:00:00.000Z' },
    });
    expect(task.status.message).toBeUndefined();
    expect(task.artifacts?.[0].parts).toEqual([
      { text: TURN.answer },
      {
        data: expect.objectContaining({ outcome: 'answered', citations: TURN.citations }),
        mediaType: 'application/json',
      },
    ]);
    expect(task.history?.map((message) => message.role)).toEqual([A2aRole.User, A2aRole.Agent]);
  });

  it('follows historyLength and includeArtifacts', () => {
    expect(answeredTask(TURN, { historyLength: 0, includeArtifacts: false })).not.toHaveProperty(
      'history',
    );
    expect(answeredTask(TURN, { historyLength: 0, includeArtifacts: false })).not.toHaveProperty(
      'artifacts',
    );
    expect(answeredTask(TURN, { historyLength: 1, includeArtifacts: true }).history).toHaveLength(
      1,
    );
  });

  it('offers a person on the status when one is offered', () => {
    const task = answeredTask(
      { ...TURN, escalationReason: AskEscalationReason.Unanswered },
      { includeArtifacts: true },
    );

    expect(task.status.message?.role).toBe(A2aRole.Agent);
  });

  it('shows an escalation as working, then completed with the reply', () => {
    const ticket = {
      id: 'esc_1',
      status: AskEscalationStatus.Open,
      reason: AskEscalationReason.Sales,
      reply: null,
      repliedAt: null,
      createdAt: TURN.at,
    };

    expect(escalationTask(ticket).status.state).toBe(A2aTaskState.Working);
    const replied = escalationTask(
      { ...ticket, status: AskEscalationStatus.Replied, reply: 'Hello', repliedAt: TURN.at },
      'conv_one',
    );
    expect(replied).toMatchObject({
      status: { state: A2aTaskState.Completed },
      contextId: 'conv_one',
    });
    expect(replied.artifacts?.[0].parts).toEqual([{ text: 'Hello' }]);
  });
});
