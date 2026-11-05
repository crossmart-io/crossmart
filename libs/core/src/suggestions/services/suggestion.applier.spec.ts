import { BadRequestException, ConflictException } from '@nestjs/common';
import { SuggestionStatus } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import type { ListingContentReader } from '../../listings/services/listing-content.reader.js';
import type { ListingOverridesService } from '../../listings/services/listing-overrides.service.js';
import { productDetail } from '../../listings/testing/listing.fixtures.js';
import { SuggestionKind } from '../enums/suggestion-kind.enum.js';
import type { SuggestionRepository } from '../repositories/suggestion.repository.js';
import {
  CONNECTION_ID,
  PRODUCT_ID,
  SUGGESTION_ID,
  suggestionRecord,
  WORKSPACE_ID,
} from '../testing/suggestion.fixtures.js';
import { SuggestionApplier } from './suggestion.applier.js';

const ACTOR = Actor.user('reviewer-1');
const TARGET = { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID, productId: PRODUCT_ID };
const REF = { workspaceId: WORKSPACE_ID, suggestionId: SUGGESTION_ID };

function setup(shownTitle = 'Mug') {
  const content = {
    read: vi.fn<ListingContentReader['read']>().mockResolvedValue({
      product: productDetail(),
      content: { title: shownTitle, descriptionHtml: '<p>Stoneware.</p>' },
    }),
  };
  const overrides = {
    saveContent: vi.fn<ListingOverridesService['saveContent']>().mockResolvedValue(),
  };
  const suggestions = {
    review: vi.fn<SuggestionRepository['review']>().mockResolvedValue(true),
    reopen: vi.fn<SuggestionRepository['reopen']>().mockResolvedValue(),
  };
  const applier = new SuggestionApplier(
    content as unknown as ListingContentReader,
    overrides as unknown as ListingOverridesService,
    suggestions as unknown as SuggestionRepository,
  );
  return { applier, content, overrides, suggestions };
}

describe('SuggestionApplier', () => {
  it('writes the proposed title as the channel override and marks it applied', async () => {
    const { applier, overrides, suggestions } = setup();

    const outcome = await applier.approve(suggestionRecord(), ACTOR);

    expect(outcome).toBe(SuggestionStatus.APPLIED);
    expect(suggestions.review).toHaveBeenCalledWith({
      ref: REF,
      status: SuggestionStatus.APPLIED,
      actor: ACTOR,
    });
    expect(overrides.saveContent).toHaveBeenCalledWith(
      TARGET,
      { title: 'Stoneware Mug, Blue, 350 ml' },
      ACTOR,
    );
  });

  it('writes a description suggestion to the description', async () => {
    const { applier, overrides } = setup();
    const record = suggestionRecord({
      kind: SuggestionKind.ListingDescription,
      currentValue: '<p>Stoneware.</p>',
      proposedValue: '<p>Hand-glazed stoneware.</p>',
    });

    await applier.approve(record, ACTOR);

    expect(overrides.saveContent).toHaveBeenCalledWith(
      TARGET,
      { descriptionHtml: '<p>Hand-glazed stoneware.</p>' },
      ACTOR,
    );
  });

  it('marks it stale, and changes nothing, when the field changed since it was made', async () => {
    const { applier, overrides, suggestions } = setup('Mug (edited by hand)');

    const outcome = await applier.approve(suggestionRecord(), ACTOR);

    expect(outcome).toBe(SuggestionStatus.STALE);
    expect(suggestions.review).toHaveBeenCalledWith(
      expect.objectContaining({ status: SuggestionStatus.STALE }),
    );
    expect(overrides.saveContent).not.toHaveBeenCalled();
  });

  it('applies nothing when another review got there first', async () => {
    const { applier, overrides, suggestions } = setup();
    suggestions.review.mockResolvedValue(false);

    await expect(applier.approve(suggestionRecord(), ACTOR)).rejects.toThrow(ConflictException);
    expect(overrides.saveContent).not.toHaveBeenCalled();
  });

  it('puts the suggestion back to pending when applying fails', async () => {
    const { applier, overrides, suggestions } = setup();
    overrides.saveContent.mockRejectedValue(new Error('database down'));

    await expect(applier.approve(suggestionRecord(), ACTOR)).rejects.toThrow('database down');
    expect(suggestions.reopen).toHaveBeenCalledWith(REF);
  });

  it.each([
    ['without a channel', { connectionId: null }],
    ['of a kind this version does not know', { kind: 'listing_bullets' }],
  ])('refuses a suggestion %s', async (_case, overrides) => {
    const { applier, suggestions } = setup();

    await expect(applier.approve(suggestionRecord(overrides), ACTOR)).rejects.toThrow(
      BadRequestException,
    );
    expect(suggestions.review).not.toHaveBeenCalled();
  });
});
