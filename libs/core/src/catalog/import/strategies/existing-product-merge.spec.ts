import { OutOfStockPolicy, ProductStatus } from '@crossmart/database';
import type { ProductDraft, VariantDraft } from '../../entities/product-draft.js';
import { ProductPatch } from '../../entities/product-patch.js';
import { ShopifyCsvParser } from '../shopify-csv/shopify-csv.parser.js';
import { mergeIntoExisting } from './existing-product-merge.js';

const HANDLE = 'speckled-stoneware-mug';
const parser = new ShopifyCsvParser();

function catalogVariant(id: string, colour: string, available: number): VariantDraft {
  return {
    id,
    sku: `HOLCLA-SPESTO-${colour.slice(0, 3).toUpperCase()}`,
    barcode: `0000${available}`,
    optionValues: [colour],
    price: '24.00',
    compareAtPrice: '28.00',
    weightGrams: 410,
    requiresShipping: true,
    taxable: false,
    outOfStockPolicy: OutOfStockPolicy.CONTINUE_SELLING,
    inventory: { tracked: true, quantity: available },
  };
}

/** The catalog product of the reported bug: three colours and every field filled in. */
function catalogMug(): ProductDraft {
  return {
    handle: HANDLE,
    title: 'Speckled Stoneware Mug',
    descriptionHtml: '<p>12 oz speckled stoneware mug.</p>',
    vendor: 'Hollow Clay Studio',
    productType: 'Kitchen',
    tags: ['kitchen', 'mug'],
    status: ProductStatus.ACTIVE,
    optionNames: ['Colour'],
    variants: [
      catalogVariant('variant-ivory', 'Ivory', 12),
      catalogVariant('variant-slate', 'Slate', 3),
      catalogVariant('variant-moss', 'Moss', 0),
    ],
    media: [{ url: 'https://cdn.example.com/mug.jpg' }],
  };
}

/** The patch an update file with these lines (header first) makes for its first product. */
function patchFrom(...lines: string[]): ProductPatch {
  const { products, fields, issues } = parser.parse(Buffer.from(lines.join('\n')), {
    partial: true,
  });
  expect(issues).toEqual([]);
  const [values] = products as [ProductDraft];
  return new ProductPatch(values, fields);
}

describe('mergeIntoExisting', () => {
  it('changes only the columns of the file, keeping every variant (the reported bug)', () => {
    const existing = catalogMug();
    const patch = patchFrom(
      'Handle,Title,Status,Variant SKU,Variant Price',
      `${HANDLE},Speckled Stoneware Mug,active,HOLCLA-SPESTO-IVO,22.00`,
    );

    const { draft, unmatchedVariants } = mergeIntoExisting(existing, patch);

    expect(unmatchedVariants).toEqual([]);
    const [ivory, ...others] = existing.variants as [VariantDraft, ...VariantDraft[]];
    expect(draft).toEqual({ ...existing, variants: [{ ...ivory, price: '22.00' }, ...others] });
  });

  it('clears a field whose column the file has but leaves empty', () => {
    const patch = patchFrom(
      'Handle,Vendor,Tags,Variant SKU,Variant Barcode,Variant Compare At Price',
      `${HANDLE},,,HOLCLA-SPESTO-SLA,,`,
    );

    const { draft } = mergeIntoExisting(catalogMug(), patch);

    expect(draft).toMatchObject({ vendor: undefined, tags: [], productType: 'Kitchen' });
    expect(draft.variants[1]).toMatchObject({
      id: 'variant-slate',
      barcode: undefined,
      compareAtPrice: undefined,
      price: '24.00',
    });
    expect(draft.variants[0]?.barcode).toBe('000012');
  });

  it('matches by SKU first, then by option values, and keeps the stock of matches', () => {
    const patch = patchFrom(
      'Handle,Option1 Name,Option1 Value,Variant SKU,Variant Inventory Tracker,Variant Inventory Qty',
      `${HANDLE},Colour,Forest,HOLCLA-SPESTO-MOS,shopify,99`,
      `${HANDLE},,Slate,NEW-SLATE-SKU,shopify,99`,
    );

    const { draft } = mergeIntoExisting(catalogMug(), patch);

    expect(
      draft.variants.map(({ id, sku, optionValues, inventory }) => ({
        id,
        sku,
        optionValues,
        inventory,
      })),
    ).toEqual([
      expect.objectContaining({ id: 'variant-ivory' }),
      {
        id: 'variant-slate',
        sku: 'NEW-SLATE-SKU',
        optionValues: ['Slate'],
        inventory: { tracked: true, quantity: 3 },
      },
      {
        id: 'variant-moss',
        sku: 'HOLCLA-SPESTO-MOS',
        optionValues: ['Forest'],
        inventory: { tracked: true, quantity: 0 },
      },
    ]);
  });

  it('adds an unknown variant that has a value for every option', () => {
    const patch = patchFrom(
      'Handle,Option1 Name,Option1 Value,Variant SKU,Variant Price,Variant Inventory Tracker,Variant Inventory Qty',
      `${HANDLE},Colour,Sand,HOLCLA-SPESTO-SAN,26.00,shopify,5`,
    );

    const { draft, unmatchedVariants } = mergeIntoExisting(catalogMug(), patch);

    expect(unmatchedVariants).toEqual([]);
    expect(draft.variants).toHaveLength(4);
    expect(draft.variants[3]?.id).toBeUndefined();
    expect(draft.variants[3]).toMatchObject({
      sku: 'HOLCLA-SPESTO-SAN',
      optionValues: ['Sand'],
      price: '26.00',
      inventory: { tracked: true, quantity: 5 },
    });
  });

  it('reports an unknown variant without option values instead of adding it', () => {
    const existing = catalogMug();
    const patch = patchFrom(
      'Handle,Variant SKU,Variant Price',
      `${HANDLE},HOLCLA-SPESTO-IVO,22.00`,
      `${HANDLE},UNKNOWN-SKU,30.00`,
    );

    const { draft, unmatchedVariants } = mergeIntoExisting(existing, patch);

    expect(unmatchedVariants).toEqual([1]);
    expect(draft.variants.map((variant) => variant.id)).toEqual(
      existing.variants.map((variant) => variant.id),
    );
  });

  it('keeps the option names and values when the file has no option columns', () => {
    const patch = patchFrom('Handle,Variant SKU,Variant Grams', `${HANDLE},HOLCLA-SPESTO-MOS,`);

    const { draft } = mergeIntoExisting(catalogMug(), patch);

    expect(draft.variants[2]).toMatchObject({ id: 'variant-moss', weightGrams: undefined });
    expect(draft.optionNames).toEqual(['Colour']);
    expect(draft.variants.map((variant) => variant.optionValues)).toEqual([
      ['Ivory'],
      ['Slate'],
      ['Moss'],
    ]);
  });

  it('keeps the catalog images unless the file lists some', () => {
    const header = 'Handle,Variant SKU,Image Src';
    const withoutImages = patchFrom(header, `${HANDLE},HOLCLA-SPESTO-IVO,`);
    expect(mergeIntoExisting(catalogMug(), withoutImages).draft.media).toEqual(catalogMug().media);

    const withImages = patchFrom(
      header,
      `${HANDLE},HOLCLA-SPESTO-IVO,https://cdn.example.com/new.jpg`,
    );
    expect(mergeIntoExisting(catalogMug(), withImages).draft.media).toEqual([
      { url: 'https://cdn.example.com/new.jpg' },
    ]);
  });
});
