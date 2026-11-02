import { DEMO_PRODUCTS } from './demo-catalog.js';
import { photosFor, productBody } from './product-factory.js';
import { DEMO_SEED, SeededRandom } from './seeded-random.js';

const EAN_LENGTH = 13;
const EAN_WEIGHTS = [1, 3];

function isValidEan13(code: string): boolean {
  const digits = code.split('').map(Number);
  const sum = digits.reduce((total, digit, index) => total + digit * EAN_WEIGHTS[index % 2]!, 0);
  return code.length === EAN_LENGTH && sum % 10 === 0;
}

function buildCatalog() {
  const random = new SeededRandom(DEMO_SEED);
  return DEMO_PRODUCTS.map((blueprint) => {
    photosFor(blueprint, random);
    return productBody(blueprint, [], random);
  });
}

describe('demo product factory', () => {
  it('builds the same catalog on every run', () => {
    expect(buildCatalog()).toEqual(buildCatalog());
  });

  it('makes one variant per size and colour combination', () => {
    const sweater = buildCatalog().find((product) => product.title === 'Merino Crew Sweater');

    expect(sweater?.optionNames).toEqual(['Size', 'Color']);
    expect(sweater?.variants).toHaveLength(15);
  });

  it('gives every variant a unique SKU and only valid in-store barcodes', () => {
    const variants = buildCatalog().flatMap((product) => product.variants);
    const skus = variants.map((variant) => variant.sku);
    const barcodes = variants.flatMap((variant) => (variant.barcode ? [variant.barcode] : []));

    expect(new Set(skus).size).toBe(skus.length);
    expect(barcodes.length).toBeGreaterThan(0);
    expect(barcodes.every((barcode) => barcode.startsWith('2') && isValidEan13(barcode))).toBe(
      true,
    );
  });

  it('mixes in the gaps and stock-outs the overview reports on', () => {
    const catalog = buildCatalog();
    const variants = catalog.flatMap((product) => product.variants);

    expect(variants.some((variant) => variant.quantity === 0)).toBe(true);
    expect(catalog.some((product) => product.descriptionHtml === '')).toBe(true);
    expect(new Set(catalog.map((product) => product.status)).size).toBeGreaterThan(1);
  });
});
