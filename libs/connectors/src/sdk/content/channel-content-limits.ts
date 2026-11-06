import type { DescriptionFormat } from './description-format.enum.js';

/**
 * What a channel accepts in a listing's title and description. Core reads these when it
 * writes content for the channel (the AI content agent), so the numbers live with the
 * connector that knows the channel.
 */
export interface ChannelContentLimits {
  /** The longest title the channel accepts, in characters. */
  titleMaxLength: number;
  /** The longest description the channel accepts, in characters; null when it states none. */
  descriptionMaxLength: number | null;
  /**
   * The longest description worth writing, in characters: the hard limit, or less where the
   * hard limit is far beyond what buyers read (eBay takes 500,000).
   */
  descriptionTargetLength: number;
  descriptionFormat: DescriptionFormat;
  /** Whether a description may link out. */
  allowsLinks: boolean;
  /** How many tags a listing takes, for channels with listing tags (Etsy). */
  tagMaxCount?: number;
  /** The longest tag the channel accepts, in characters. */
  tagMaxLength?: number;
}
