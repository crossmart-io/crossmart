import type { Colorway, ProductBlueprint } from './demo-catalog.js';
import type { SeededRandom } from './seeded-random.js';

/** The `POST /products` body, as the API documents it. */
export interface NewProductBody {
  title: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  status: ProductStatusValue;
  optionNames: string[];
  media: { url: string; altText: string }[];
  variants: NewVariantBody[];
}

export interface NewVariantBody {
  sku: string;
  barcode?: string;
  optionValues: string[];
  price: string;
  compareAtPrice?: string;
  cost: string;
  weightGrams: number;
  tracked: boolean;
  quantity: number;
}

export enum ProductStatusValue {
  Active = 'ACTIVE',
  Draft = 'DRAFT',
  Archived = 'ARCHIVED',
}

/** How the demo catalog is mixed, so every screen has something to show. */
const MIX = {
  draft: 0.15,
  archived: 0.06,
  noDescription: 0.1,
  noImages: 0.15,
  noBarcode: 0.3,
  onSale: 0.2,
  outOfStockVariant: 0.08,
  untracked: 0.05,
} as const;

const MAX_STOCK = 60;
const MIN_RESTOCKED = 1;
const SALE_MARKUP = 1.25;
/** What the demo merchant pays per unit, as a share of the price. */
const COST_RATIO = 0.45;
const LARGE_SIZE_SURCHARGE = 4;
const LARGE_SIZES = new Set(['XL', 'King', 'Large']);
const CENTS = 100;
const SKU_PART_LENGTH = 3;
const SKU_PRODUCT_PART_LENGTH = 6;
const AMOUNT_DECIMALS = 2;
const MAX_IMAGES = 3;
const SIZE_OPTION = 'Size';
const COLOR_OPTION = 'Color';

/** A colour photo per colourway, uploaded before the product is created. */
export interface PhotoRequest {
  colorway: Colorway;
  altText: string;
}

export function photosFor(blueprint: ProductBlueprint, random: SeededRandom): PhotoRequest[] {
  if (random.chance(MIX.noImages)) return [];
  const colorways = blueprint.colorways ?? [{ name: blueprint.productType, hex: '#c8bfae' }];
  return colorways.slice(0, MAX_IMAGES).map((colorway) => ({
    colorway,
    altText: `${blueprint.title} in ${colorway.name.toLowerCase()}`,
  }));
}

export function productBody(
  blueprint: ProductBlueprint,
  media: { url: string; altText: string }[],
  random: SeededRandom,
): NewProductBody {
  const options = optionsOf(blueprint);
  const withBarcodes = !random.chance(MIX.noBarcode);
  const onSale = random.chance(MIX.onSale);
  return {
    title: blueprint.title,
    descriptionHtml: random.chance(MIX.noDescription) ? '' : blueprint.descriptionHtml,
    vendor: blueprint.vendor,
    productType: blueprint.productType,
    tags: [...blueprint.tags],
    status: statusOf(random),
    optionNames: options.map((option) => option.name),
    media,
    variants: combinations(options.map((option) => option.values)).map((optionValues) =>
      variantBody(blueprint, optionValues, { withBarcodes, onSale }, random),
    ),
  };
}

interface Option {
  name: string;
  values: readonly string[];
}

function optionsOf(blueprint: ProductBlueprint): Option[] {
  const options: Option[] = [];
  if (blueprint.sizes) options.push({ name: SIZE_OPTION, values: blueprint.sizes });
  if (blueprint.colorways && blueprint.colorways.length > 1) {
    options.push({ name: COLOR_OPTION, values: blueprint.colorways.map((color) => color.name) });
  }
  return options;
}

/** Every combination of option values; one empty combination for a product without options. */
function combinations(valueLists: readonly (readonly string[])[]): string[][] {
  return valueLists.reduce<string[][]>(
    (rows, values) => rows.flatMap((row) => values.map((value) => [...row, value])),
    [[]],
  );
}

function statusOf(random: SeededRandom): ProductStatusValue {
  const roll = random.next();
  if (roll < MIX.archived) return ProductStatusValue.Archived;
  if (roll < MIX.archived + MIX.draft) return ProductStatusValue.Draft;
  return ProductStatusValue.Active;
}

interface PricingChoices {
  withBarcodes: boolean;
  onSale: boolean;
}

function variantBody(
  blueprint: ProductBlueprint,
  optionValues: string[],
  { withBarcodes, onSale }: PricingChoices,
  random: SeededRandom,
): NewVariantBody {
  const surcharge = optionValues.some((value) => LARGE_SIZES.has(value)) ? LARGE_SIZE_SURCHARGE : 0;
  const price = Number(blueprint.basePrice) + surcharge;
  const outOfStock = random.chance(MIX.outOfStockVariant);
  return {
    sku: skuOf(blueprint, optionValues),
    ...(withBarcodes ? { barcode: ean13(random) } : {}),
    optionValues,
    price: toAmount(price),
    ...(onSale ? { compareAtPrice: toAmount(price * SALE_MARKUP) } : {}),
    cost: toAmount(price * COST_RATIO),
    weightGrams: blueprint.weightGrams,
    tracked: !random.chance(MIX.untracked),
    quantity: outOfStock ? 0 : random.integer(MIN_RESTOCKED, MAX_STOCK),
  };
}

function toAmount(value: number): string {
  return (Math.round(value * CENTS) / CENTS).toFixed(AMOUNT_DECIMALS);
}

function skuPart(text: string): string {
  return text
    .replace(/[^A-Za-z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.slice(0, SKU_PART_LENGTH))
    .join('')
    .toUpperCase()
    .slice(0, SKU_PRODUCT_PART_LENGTH);
}

/** "NOR-MERCRE-M-CHA": vendor, product, then each option value. */
function skuOf(blueprint: ProductBlueprint, optionValues: string[]): string {
  return [skuPart(blueprint.vendor), skuPart(blueprint.title), ...optionValues.map(skuPart)]
    .filter(Boolean)
    .join('-');
}

const EAN_BODY_LENGTH = 12;
const DEMO_GS1_PREFIX = '200';
const EAN_ODD_WEIGHT = 1;
const EAN_EVEN_WEIGHT = 3;
const EAN_WEIGHT_PERIOD = 2;
const DECIMAL_BASE = 10;
const MAX_DIGIT = 9;

/**
 * A valid EAN-13 in the 200–299 range, which GS1 reserves for in-store use,
 * so a demo barcode can never collide with a real product.
 */
function ean13(random: SeededRandom): string {
  let body = DEMO_GS1_PREFIX;
  while (body.length < EAN_BODY_LENGTH) body += String(random.integer(0, MAX_DIGIT));
  const sum = body
    .split('')
    .reduce(
      (total, digit, index) =>
        total +
        Number(digit) * (index % EAN_WEIGHT_PERIOD === 0 ? EAN_ODD_WEIGHT : EAN_EVEN_WEIGHT),
      0,
    );
  return body + String((DECIMAL_BASE - (sum % DECIMAL_BASE)) % DECIMAL_BASE);
}
