import { ActivityOutcome, SuggestionCreatorType } from '@crossmart/database';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import {
  AiKeyRejectedError,
  AiNotConfiguredError,
  AiOutputRejectedError,
} from '../../ai/errors/ai.errors.js';
import { SuggestionAgent } from '../../suggestions/enums/suggestion-agent.enum.js';
import { SuggestionKind } from '../../suggestions/enums/suggestion-kind.enum.js';
import type { SuggestionWriter } from '../../suggestions/services/suggestion.writer.js';
import { CONTENT_JOB, contentTarget, GENERATED } from '../testing/content-target.fixtures.js';
import type { ContentGenerator } from './content.generator.js';
import { ContentGenerationRunner } from './content-generation.runner.js';
import type { ContentTargetLoader } from './content-target.loader.js';

const NOT_FINAL = { finalAttempt: false };

function setup() {
  const targets = { load: vi.fn<ContentTargetLoader['load']>().mockResolvedValue(contentTarget()) };
  const generator = {
    generate: vi.fn<ContentGenerator['generate']>().mockResolvedValue(GENERATED),
  };
  const suggestions = { propose: vi.fn<SuggestionWriter['propose']>().mockResolvedValue(2) };
  const activity = new InMemoryActivityRecorder();
  const runner = new ContentGenerationRunner(
    targets as unknown as ContentTargetLoader,
    generator as unknown as ContentGenerator,
    suggestions as unknown as SuggestionWriter,
    activity,
  );
  return { runner, targets, generator, suggestions, activity };
}

describe('ContentGenerationRunner', () => {
  it('proposes the title and description as pending agent suggestions for the requester', async () => {
    const { runner, suggestions, activity } = setup();

    await runner.run(CONTENT_JOB, NOT_FINAL);

    const [proposed] = suggestions.propose.mock.calls[0];
    expect(proposed).toEqual([
      expect.objectContaining({
        kind: SuggestionKind.ListingTitle,
        currentValue: 'Mug',
        proposedValue: GENERATED.title,
        rationale: GENERATED.titleRationale,
        createdByType: SuggestionCreatorType.AGENT,
        agent: SuggestionAgent.ContentGenerator,
        requestedByUserId: 'user-1',
      }),
      expect.objectContaining({
        kind: SuggestionKind.ListingDescription,
        currentValue: '<p>Stoneware.</p>',
        proposedValue: GENERATED.descriptionHtml,
      }),
    ]);
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.ContentGenerated,
      detail: 'eBay US',
    });
  });

  it('does nothing once the product or store is gone', async () => {
    const { runner, targets, generator } = setup();
    targets.load.mockResolvedValue(null);

    await runner.run(CONTENT_JOB, NOT_FINAL);

    expect(generator.generate).not.toHaveBeenCalled();
  });

  it.each([
    new AiOutputRejectedError('not JSON'),
    new AiNotConfiguredError(),
    new AiKeyRejectedError(),
  ])('logs %s as a failure and does not retry', async (error) => {
    const { runner, generator, suggestions, activity } = setup();
    generator.generate.mockRejectedValue(error);

    await expect(runner.run(CONTENT_JOB, NOT_FINAL)).resolves.toBeUndefined();
    expect(suggestions.propose).not.toHaveBeenCalled();
    expect(activity.entries[0].outcome).toBe(ActivityOutcome.FAILED);
  });

  it('retries outages, logging them only on the last attempt', async () => {
    const { runner, generator, activity } = setup();
    generator.generate.mockRejectedValue(new Error('overloaded'));

    await expect(runner.run(CONTENT_JOB, NOT_FINAL)).rejects.toThrow('overloaded');
    expect(activity.entries).toHaveLength(0);

    await expect(runner.run(CONTENT_JOB, { finalAttempt: true })).rejects.toThrow('overloaded');
    expect(activity.entries[0].outcome).toBe(ActivityOutcome.FAILED);
  });
});
