import type { FalabellaAttributePlacement } from '../falabella.enums.js';

/** A category attribute in Crossmart's terms: what to call it, where it goes, what it takes. */
export interface FalabellaAttribute {
  /** What the merchant sees, such as `Color básico variant`. */
  label: string;
  /** The element a product carries it in, such as `ColorBasicoVariant`. */
  feedName: string;
  required: boolean;
  placement: FalabellaAttributePlacement;
  /** Whether it tells a product's variations apart (Falabella's `Variation` group). */
  variation: boolean;
  /** The values it accepts; empty for free text. */
  options: string[];
}
