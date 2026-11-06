const NOT_ANCHOR_CHARACTERS = /[^\p{L}\p{N}\s_-]/gu;
const SPACES = /\s/g;
const HYPHEN = '-';

/**
 * A heading's anchor as GitHub and Starlight (github-slugger) write it: lowercase, punctuation
 * removed, spaces as hyphens. Repeated headings get `-1`, `-2`… in page order.
 */
export class HeadingAnchors {
  private readonly seen = new Map<string, number>();

  anchor(heading: string): string {
    const base = heading.toLowerCase().replace(NOT_ANCHOR_CHARACTERS, '').replace(SPACES, HYPHEN);
    const count = this.seen.get(base) ?? 0;
    this.seen.set(base, count + 1);
    return count ? `${base}${HYPHEN}${count}` : base;
  }
}
