import { ConflictException, NotFoundException } from '@nestjs/common';
import { SuggestionStatus } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { SuggestionView } from '../entities/suggestion.js';
import type { SuggestionRepository } from '../repositories/suggestion.repository.js';
import { SUGGESTION_ID, suggestionRecord, WORKSPACE_ID } from '../testing/suggestion.fixtures.js';
import type { SuggestionApplier } from './suggestion.applier.js';
import { SuggestionReviewService } from './suggestion-review.service.js';
import type { SuggestionsService } from './suggestions.service.js';

const ACTOR = Actor.user('reviewer-1');
const REF = { workspaceId: WORKSPACE_ID, suggestionId: SUGGESTION_ID };
const SECOND_ID = '01938a6e-0000-7000-8000-000000000002';

function setup() {
  const suggestions = {
    find: vi.fn<SuggestionRepository['find']>().mockResolvedValue(suggestionRecord()),
    findPending: vi.fn<SuggestionRepository['findPending']>().mockResolvedValue([]),
    review: vi.fn<SuggestionRepository['review']>().mockResolvedValue(true),
  };
  const applier = {
    approve: vi.fn<SuggestionApplier['approve']>().mockResolvedValue(SuggestionStatus.APPLIED),
  };
  const views = {
    get: vi.fn<SuggestionsService['get']>((ref) =>
      Promise.resolve({ id: ref.suggestionId } as SuggestionView),
    ),
  };
  const activity = new InMemoryActivityRecorder();
  const service = new SuggestionReviewService(
    suggestions as unknown as SuggestionRepository,
    applier as unknown as SuggestionApplier,
    views as unknown as SuggestionsService,
    activity,
  );
  return { service, suggestions, applier, activity };
}

describe('SuggestionReviewService', () => {
  it('approves a pending suggestion and logs it against the product', async () => {
    const { service, applier, activity } = setup();

    const view = await service.approve(REF, ACTOR);

    expect(view.id).toBe(SUGGESTION_ID);
    expect(applier.approve).toHaveBeenCalledWith(suggestionRecord(), ACTOR);
    expect(activity.entries).toEqual([
      expect.objectContaining({
        action: ActivityAction.SuggestionApproved,
        subject: expect.objectContaining({ label: 'Mug' }),
        detail: 'title on eBay US',
      }),
    ]);
  });

  it('logs no approval when the suggestion turned out stale', async () => {
    const { service, applier, activity } = setup();
    applier.approve.mockResolvedValue(SuggestionStatus.STALE);

    await service.approve(REF, ACTOR);

    expect(activity.entries).toHaveLength(0);
  });

  it('rejects a pending suggestion without changing anything', async () => {
    const { service, suggestions, applier, activity } = setup();

    await service.reject(REF, ACTOR);

    expect(suggestions.review).toHaveBeenCalledWith({
      ref: REF,
      status: SuggestionStatus.REJECTED,
      actor: ACTOR,
    });
    expect(applier.approve).not.toHaveBeenCalled();
    expect(activity.entries[0].action).toBe(ActivityAction.SuggestionRejected);
  });

  it('refuses a suggestion that is gone or already reviewed', async () => {
    const { service, suggestions } = setup();
    suggestions.find.mockResolvedValueOnce(null);
    await expect(service.approve(REF, ACTOR)).rejects.toThrow(NotFoundException);

    suggestions.find.mockResolvedValueOnce(suggestionRecord({ status: SuggestionStatus.APPLIED }));
    await expect(service.reject(REF, ACTOR)).rejects.toThrow(ConflictException);
  });

  it('bulk approves the pending ones, skips the rest and logs one bulk event', async () => {
    const { service, suggestions, applier, activity } = setup();
    suggestions.findPending.mockResolvedValue([
      suggestionRecord(),
      suggestionRecord({ id: SECOND_ID }),
    ]);
    applier.approve
      .mockResolvedValueOnce(SuggestionStatus.APPLIED)
      .mockRejectedValueOnce(new ConflictException());

    const result = await service.bulkApprove({
      workspaceId: WORKSPACE_ID,
      suggestionIds: [SUGGESTION_ID, SECOND_ID, 'not-pending'],
      actor: ACTOR,
    });

    expect(result.items.map((item) => item.id)).toEqual([SUGGESTION_ID]);
    expect(result.skippedIds).toEqual([SECOND_ID, 'not-pending']);
    expect(activity.entries).toEqual([
      expect.objectContaining({ action: ActivityAction.SuggestionsBulkApproved, itemCount: 1 }),
    ]);
  });
});
