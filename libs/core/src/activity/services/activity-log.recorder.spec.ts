import { BadRequestException, Logger } from '@nestjs/common';
import { ActivityActorType, ActivityOutcome } from '@crossmart/database';
import { ACTIVITY_LABEL_MAX_LENGTH, UNEXPECTED_FAILURE_REASON } from '../activity.constants.js';
import { Actor } from '../entities/actor.js';
import { ActivityAction } from '../enums/activity-action.enum.js';
import { ActivitySubjectType } from '../enums/activity-subject-type.enum.js';
import type { ActivityEventRepository } from '../repositories/activity-event.repository.js';
import { ActivityLogRecorder } from './activity-log.recorder.js';

const WORKSPACE_ID = 'ws-1';

function setup() {
  const repository = { create: vi.fn<ActivityEventRepository['create']>().mockResolvedValue() };
  const recorder = new ActivityLogRecorder(repository as unknown as ActivityEventRepository);
  return { recorder, repository };
}

describe('ActivityLogRecorder', () => {
  it('stores who did what, with a summary and the subject in its own history', async () => {
    const { recorder, repository } = setup();

    await recorder.record(WORKSPACE_ID, Actor.user('user-1'), {
      action: ActivityAction.ProductUpdated,
      subject: { type: ActivitySubjectType.Product, id: 'p-1', label: 'Mug' },
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: WORKSPACE_ID,
        actorType: ActivityActorType.USER,
        actorUserId: 'user-1',
        actorApiKeyId: null,
        outcome: ActivityOutcome.SUCCEEDED,
        subjectIds: ['p-1'],
        summary: 'Updated product “Mug”',
      }),
    );
  });

  it('keeps each related subject once and cuts long labels', async () => {
    const { recorder, repository } = setup();

    await recorder.record(WORKSPACE_ID, Actor.apiKey('key-1'), {
      action: ActivityAction.ProductUpdated,
      subject: { type: ActivitySubjectType.Product, id: 'a', label: 'x'.repeat(1000) },
      relatedSubjectIds: ['a', 'b', 'b'],
    });

    const [input] = repository.create.mock.calls[0]!;
    expect(input.subjectIds).toEqual(['a', 'b']);
    expect(input.subjectLabel).toHaveLength(ACTIVITY_LABEL_MAX_LENGTH);
    expect(input.actorApiKeyId).toBe('key-1');
  });

  it('records failures with a reason that is safe to show', async () => {
    const { recorder, repository } = setup();
    const entry = { action: ActivityAction.ProductsImported };

    await recorder.recordFailure(
      WORKSPACE_ID,
      Actor.system(),
      entry,
      new BadRequestException('Bad'),
    );
    await recorder.recordFailure(WORKSPACE_ID, Actor.system(), entry, new Error('SQL: secret'));

    const reasons = repository.create.mock.calls.map(([input]) => input.failureReason);
    expect(reasons).toEqual(['Bad', UNEXPECTED_FAILURE_REASON]);
    expect(repository.create.mock.calls[0]![0].outcome).toBe(ActivityOutcome.FAILED);
  });

  it('never fails the caller when the log cannot be written', async () => {
    const { recorder, repository } = setup();
    repository.create.mockRejectedValue(new Error('connection lost'));
    const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    await expect(
      recorder.record(WORKSPACE_ID, Actor.system(), { action: ActivityAction.ProductDeleted }),
    ).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledWith(expect.not.stringContaining('connection lost'));
    logError.mockRestore();
  });
});
