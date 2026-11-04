import { readFileSync } from 'node:fs';
import { BadRequestException } from '@nestjs/common';
import { OutOfStockPolicy, ProductStatus } from '@crossmart/database';
import { ImportIssueCode } from '../../enums/import-issue-code.enum.js';
import { ProductDraftField } from '../../enums/product-draft-field.enum.js';
import { ShopifyCsvParser } from './shopify-csv.parser.js';

const FIXTURE = readFileSync(new URL('./__fixtures__/products.csv', import.meta.url));

const HEADER =
  'Handle,Title,Body (HTML),Status,Option1 Name,Option1 Value,Variant SKU,Variant Price,Variant Inventory Qty,Image Src,Image Position';

function csv(...rows: string[]): Buffer {
  return Buffer.from([HEADER, ...rows].join('\n'));
}

const parser = new ShopifyCsvParser();

describe('ShopifyCsvParser with a real Shopify export', () => {
  const { products, issues } = parser.parse(FIXTURE);
  const byHandle = new Map(products.map((product) => [product.handle, product]));

  it('reads every product and variant', () => {
    expect(issues).toEqual([]);
    expect(products).toHaveLength(8);
    expect(products.flatMap((product) => product.variants)).toHaveLength(17);
  });

  it('reads options and variant values in order', () => {
    const sweater = byHandle.get('merino-crew-sweater');
    expect(sweater?.optionNames).toEqual(['Size', 'Color']);
    expect(sweater?.variants.map((variant) => variant.optionValues)).toContainEqual(['L', 'Navy']);
    expect(sweater?.tags).toEqual(['apparel', 'wool', 'men']);
  });

  it('drops the "Default Title" placeholder option', () => {
    const candle = byHandle.get('beeswax-candle');
    expect(candle?.optionNames).toEqual([]);
    expect(candle?.variants[0]?.optionValues).toEqual([]);
    expect(candle?.status).toBe(ProductStatus.DRAFT);
  });

  it('keeps prices exact and stock as typed', () => {
    const [olive] = byHandle.get('canvas-tote-bag')?.variants ?? [];
    expect(olive).toMatchObject({
      sku: 'NF-WCT-OLV',
      price: '64.00',
      compareAtPrice: '79.00',
      weightGrams: 780,
      inventory: { tracked: true, quantity: 25 },
    });
  });

  it('maps the continue-selling policy', () => {
    const moss = byHandle
      .get('stoneware-mug')
      ?.variants.find((variant) => variant.sku === 'HCS-SSM-MOS');
    expect(moss?.outOfStockPolicy).toBe(OutOfStockPolicy.CONTINUE_SELLING);
  });
});

describe('ShopifyCsvParser edge cases', () => {
  it('collects images from image-only rows in position order', () => {
    const { products } = parser.parse(
      csv(
        'mug,Mug,,active,Title,Default Title,MUG-1,10,1,https://cdn.example.com/b.jpg,2',
        'mug,,,,,,,,,https://cdn.example.com/a.jpg,1',
        'mug,,,,,,,,,https://cdn.example.com/a.jpg,3',
      ),
    );
    expect(products[0]?.media.map((media) => media.url)).toEqual([
      'https://cdn.example.com/a.jpg',
      'https://cdn.example.com/b.jpg',
    ]);
    expect(products[0]?.variants).toHaveLength(1);
  });

  it('rejects only the product with a bad price, with its row number', () => {
    const { products, issues } = parser.parse(
      csv('good,Good,,active,,,G-1,5,0,,', 'bad,Bad,,active,,,B-1,five,0,,'),
    );
    expect(products.map((product) => product.handle)).toEqual(['good']);
    expect(issues).toEqual([
      expect.objectContaining({ handle: 'bad', row: 3, code: ImportIssueCode.InvalidValue }),
    ]);
  });

  it('rejects image URLs that are not http or https', () => {
    const { issues } = parser.parse(csv('x,X,,active,,,X-1,5,0,file:///etc/passwd,1'));
    expect(issues[0]?.code).toBe(ImportIssueCode.InvalidValue);
  });

  it('rejects two variants with the same option values', () => {
    const { issues } = parser.parse(csv('tee,Tee,,active,Size,M,T-1,5,0,,', 'tee,,,,,M,T-2,5,0,,'));
    expect(issues[0]?.code).toBe(ImportIssueCode.InvalidOptions);
  });

  it('refuses a file that is not a Shopify export', () => {
    expect(() => parser.parse(Buffer.from('sku,price\nA,1'))).toThrow(BadRequestException);
  });
});

describe('ShopifyCsvParser partial parse, for updates', () => {
  function partial(...lines: string[]) {
    return parser.parse(Buffer.from(lines.join('\n')), { partial: true });
  }

  it('reports the fields the file has columns for', () => {
    const { fields } = partial('Handle,Published,Variant SKU,Variant Barcode', 'mug,TRUE,M-1,');
    expect([...fields].sort()).toEqual(
      [ProductDraftField.Status, ProductDraftField.Sku, ProductDraftField.Barcode].sort(),
    );
  });

  it('reads a file without the title and price columns, leaving validation to the merge', () => {
    const { products, issues, variantRowsByHandle } = partial(
      'Handle,Variant SKU',
      'mug,MUG-1',
      'mug,MUG-2',
      'tee,TEE-1',
    );
    expect(issues).toEqual([]);
    expect(products.map((product) => product.variants.map((variant) => variant.sku))).toEqual([
      ['MUG-1', 'MUG-2'],
      ['TEE-1'],
    ]);
    expect(variantRowsByHandle).toEqual(
      new Map([
        ['mug', [2, 3]],
        ['tee', [4]],
      ]),
    );
  });

  it('still requires a value in a required column the file has', () => {
    const { issues } = partial('Handle,Variant SKU,Variant Price', 'mug,MUG-1,');
    expect(issues).toEqual([
      expect.objectContaining({ code: ImportIssueCode.MissingValue, handle: 'mug', row: 2 }),
    ]);
  });

  it('requires the title and price columns in a full parse', () => {
    expect(() => parser.parse(Buffer.from('Handle,Variant SKU\nmug,MUG-1'))).toThrow(
      BadRequestException,
    );
    const { issues } = parser.parse(Buffer.from('Handle,Title,Variant SKU\nmug,Mug,MUG-1'));
    expect(issues).toEqual([expect.objectContaining({ code: ImportIssueCode.MissingValue })]);
  });
});

describe('ShopifyCsvParser cost per item', () => {
  const header = 'Handle,Title,Variant SKU,Variant Price,Cost per item';

  it('reads the optional cost column as an exact amount, and an empty cell as no cost', () => {
    const { products, fields } = parser.parse(
      Buffer.from([header, 'mug,Mug,MUG-1,89,40.5', 'cup,Cup,CUP-1,12,'].join('\n')),
    );

    expect(products.map((product) => product.variants[0]?.cost)).toEqual(['40.50', undefined]);
    expect(fields.has(ProductDraftField.Cost)).toBe(true);
  });

  it('leaves cost out of update files that have no cost column', () => {
    const { fields } = parser.parse(Buffer.from('Handle,Variant Price\nmug,90'), { partial: true });

    expect(fields.has(ProductDraftField.Cost)).toBe(false);
  });

  it('rejects a cost that is not an amount', () => {
    const { issues } = parser.parse(Buffer.from([header, 'mug,Mug,MUG-1,89,cheap'].join('\n')));

    expect(issues[0]?.code).toBe(ImportIssueCode.InvalidValue);
  });
});
