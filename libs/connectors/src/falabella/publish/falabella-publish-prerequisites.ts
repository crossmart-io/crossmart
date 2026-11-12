import type { ChannelSettings } from '../../sdk/channel-settings.js';
import { PublishRequirement } from '../../sdk/publishing/publish-requirement.enum.js';
import type {
  PublishCandidate,
  UnmetPublishRequirement,
} from '../../sdk/publishing/unmet-publish-requirement.js';
import { isFalabellaSettings } from '../falabella-settings.js';
import { falabellaImageUrls } from './falabella-images.js';

const RECONNECT = 'Connect this Falabella account again so Crossmart can read its details.';
const NEEDS_IMAGE = 'Falabella lists products with at least one image at an https address.';

export function unmetFalabellaAccountRequirements(
  settings: ChannelSettings | null,
): UnmetPublishRequirement[] {
  if (settings && isFalabellaSettings(settings)) return [];
  return [{ requirement: PublishRequirement.AccountSettings, reason: RECONNECT }];
}

export function unmetFalabellaProductRequirements(
  candidate: PublishCandidate,
): UnmetPublishRequirement[] {
  if (falabellaImageUrls(candidate.imageUrls).length > 0) return [];
  return [{ requirement: PublishRequirement.Images, reason: NEEDS_IMAGE }];
}
