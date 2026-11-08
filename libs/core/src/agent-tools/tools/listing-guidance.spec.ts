import { PublishRequirement } from '@crossmart/connectors/sdk/publishing/publish-requirement.enum.js';
import { ListingDisplayState } from '../../listings/enums/listing-display-state.enum.js';
import { ALL_TOOLS } from './index.js';
import { LISTING_STATE_GUIDE, REQUIREMENT_NEXT_STEPS } from './listing-guidance.js';

const SNAKE_CASE_WORD = /\b[a-z]+(?:_[a-z]+)+\b/g;

describe('Listing guidance', () => {
  it('names only tools the server offers, besides requirements and states', () => {
    const known = new Set<string>([
      ...ALL_TOOLS.map((spec) => spec.name),
      ...Object.values(PublishRequirement),
      ...Object.values(ListingDisplayState),
    ]);
    const unknown = (LISTING_STATE_GUIDE.match(SNAKE_CASE_WORD) ?? []).filter(
      (word) => !known.has(word),
    );
    expect(unknown).toEqual([]);
  });

  it('has a next step for every requirement', () => {
    for (const requirement of Object.values(PublishRequirement)) {
      const step = [requirement, REQUIREMENT_NEXT_STEPS[requirement]].join(': ');
      expect(LISTING_STATE_GUIDE).toContain(step);
    }
  });
});
