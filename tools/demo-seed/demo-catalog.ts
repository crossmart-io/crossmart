/**
 * The demo catalog: invented brands with the kinds of products small multichannel sellers
 * really list. Nothing here describes a real company or a real customer.
 */

export interface Colorway {
  name: string;
  /** `#rrggbb`, used for the generated product photos. */
  hex: string;
}

export interface ProductBlueprint {
  title: string;
  vendor: string;
  productType: string;
  tags: readonly string[];
  /** Price of the cheapest variant, as a decimal string. */
  basePrice: string;
  descriptionHtml: string;
  sizes?: readonly string[];
  colorways?: readonly Colorway[];
  weightGrams: number;
}

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const;
const SHORT_SIZES = ['S', 'M', 'L'] as const;

const SAND: Colorway = { name: 'Sand', hex: '#d8c3a5' };
const OLIVE: Colorway = { name: 'Olive', hex: '#6b7048' };
const NAVY: Colorway = { name: 'Navy', hex: '#26324a' };
const CHARCOAL: Colorway = { name: 'Charcoal', hex: '#3d3f42' };
const OAT: Colorway = { name: 'Oat', hex: '#e6dccb' };
const RUST: Colorway = { name: 'Rust', hex: '#a2532f' };
const SAGE: Colorway = { name: 'Sage', hex: '#9caf88' };
const CLAY: Colorway = { name: 'Clay', hex: '#b9795a' };
const IVORY: Colorway = { name: 'Ivory', hex: '#efe9dc' };
const SLATE: Colorway = { name: 'Slate', hex: '#5d6b78' };
const FOREST: Colorway = { name: 'Forest', hex: '#2f4a3a' };
const HONEY: Colorway = { name: 'Honey', hex: '#c9973f' };

export const DEMO_PRODUCTS: readonly ProductBlueprint[] = [
  {
    title: 'Merino Crew Sweater',
    vendor: 'Northfield Goods',
    productType: 'Sweaters',
    tags: ['apparel', 'wool', 'knitwear'],
    basePrice: '89.00',
    descriptionHtml:
      '<p>Fine-gauge merino crew neck. Soft, breathable and machine washable on a wool cycle.</p><ul><li>100% extra-fine merino</li><li>Regular fit</li></ul>',
    sizes: APPAREL_SIZES,
    colorways: [CHARCOAL, OAT, NAVY],
    weightGrams: 330,
  },
  {
    title: 'Washed Linen Shirt',
    vendor: 'Northfield Goods',
    productType: 'Shirts',
    tags: ['apparel', 'linen', 'summer'],
    basePrice: '68.00',
    descriptionHtml:
      '<p>Garment-washed European linen that softens with every wear.</p><ul><li>Relaxed fit</li><li>Corozo buttons</li></ul>',
    sizes: APPAREL_SIZES,
    colorways: [SAND, OLIVE, IVORY],
    weightGrams: 240,
  },
  {
    title: 'Heavyweight Cotton Tee',
    vendor: 'Northfield Goods',
    productType: 'T-shirts',
    tags: ['apparel', 'cotton', 'essentials'],
    basePrice: '32.00',
    descriptionHtml: '<p>A 240 gsm tee with a dense hand and a collar that keeps its shape.</p>',
    sizes: APPAREL_SIZES,
    colorways: [IVORY, CHARCOAL, SAGE, RUST],
    weightGrams: 260,
  },
  {
    title: 'Waxed Canvas Tote Bag',
    vendor: 'Northfield Goods',
    productType: 'Bags',
    tags: ['accessories', 'canvas', 'carry'],
    basePrice: '64.00',
    descriptionHtml:
      '<p>Water-resistant waxed canvas with leather handles and an inside zip pocket.</p>',
    colorways: [OLIVE, NAVY, SAND],
    weightGrams: 720,
  },
  {
    title: 'Leather Card Holder',
    vendor: 'Northfield Goods',
    productType: 'Small leather goods',
    tags: ['accessories', 'leather', 'gift'],
    basePrice: '39.00',
    descriptionHtml: '<p>Vegetable-tanned leather, four card slots and a centre pocket.</p>',
    colorways: [HONEY, CHARCOAL],
    weightGrams: 40,
  },
  {
    title: 'Speckled Stoneware Mug',
    vendor: 'Hollow Clay Studio',
    productType: 'Mugs',
    tags: ['kitchen', 'ceramic', 'handmade'],
    basePrice: '22.00',
    descriptionHtml:
      '<p>Wheel-thrown stoneware with a speckled glaze. Holds 350 ml. Dishwasher safe.</p>',
    colorways: [IVORY, SAGE, CLAY],
    weightGrams: 410,
  },
  {
    title: 'Ceramic Pour-Over Coffee Set',
    vendor: 'Hollow Clay Studio',
    productType: 'Coffee',
    tags: ['kitchen', 'coffee', 'ceramic'],
    basePrice: '48.00',
    descriptionHtml:
      '<p>Hand-glazed ceramic dripper with a matching 600 ml carafe. Uses size 02 filters.</p>',
    colorways: [IVORY, SLATE],
    weightGrams: 1150,
  },
  {
    title: 'Stoneware Serving Bowl',
    vendor: 'Hollow Clay Studio',
    productType: 'Bowls',
    tags: ['kitchen', 'ceramic', 'tableware'],
    basePrice: '54.00',
    descriptionHtml:
      '<p>A wide 28 cm bowl for salads and shared plates, glazed inside and out.</p>',
    colorways: [IVORY, CLAY],
    weightGrams: 1600,
  },
  {
    title: 'Hand-Poured Beeswax Candle',
    vendor: 'Hollow Clay Studio',
    productType: 'Candles',
    tags: ['home', 'candle', 'gift'],
    basePrice: '28.00',
    descriptionHtml:
      '<p>Pure beeswax in a reusable ceramic vessel. About 40 hours of burn time.</p>',
    colorways: [HONEY],
    weightGrams: 380,
  },
  {
    title: 'Washed Linen Napkins (Set of 4)',
    vendor: 'Lumen Home',
    productType: 'Table linen',
    tags: ['home', 'linen', 'tableware'],
    basePrice: '36.00',
    descriptionHtml: '<p>Stonewashed linen napkins, 45 × 45 cm, with mitred corners.</p>',
    colorways: [OAT, SAGE, RUST, SLATE],
    weightGrams: 220,
  },
  {
    title: 'Linen Duvet Cover',
    vendor: 'Lumen Home',
    productType: 'Bedding',
    tags: ['home', 'linen', 'bedroom'],
    basePrice: '189.00',
    descriptionHtml:
      '<p>Pre-washed French flax linen with coconut-shell buttons. Breathable in summer, warm in winter.</p>',
    sizes: ['Single', 'Double', 'King'],
    colorways: [OAT, SAGE, SLATE],
    weightGrams: 1400,
  },
  {
    title: 'Wool Throw Blanket',
    vendor: 'Lumen Home',
    productType: 'Throws',
    tags: ['home', 'wool', 'living room'],
    basePrice: '120.00',
    descriptionHtml: '<p>Woven lambswool throw, 130 × 180 cm, finished with a twisted fringe.</p>',
    colorways: [OAT, FOREST, RUST],
    weightGrams: 950,
  },
  {
    title: 'Oak Cutting Board',
    vendor: 'Cedar & Pine',
    productType: 'Cutting boards',
    tags: ['kitchen', 'wood', 'gift'],
    basePrice: '58.00',
    descriptionHtml: '<p>End-grain European oak, oiled by hand. Gentle on knife edges.</p>',
    sizes: ['Small', 'Large'],
    weightGrams: 1800,
  },
  {
    title: 'Walnut Serving Tray',
    vendor: 'Cedar & Pine',
    productType: 'Trays',
    tags: ['kitchen', 'wood', 'tableware'],
    basePrice: '74.00',
    descriptionHtml: '<p>Solid walnut with carved handles and a food-safe oil finish.</p>',
    weightGrams: 1100,
  },
  {
    title: 'Pine Wall Shelf',
    vendor: 'Cedar & Pine',
    productType: 'Shelves',
    tags: ['home', 'wood', 'storage'],
    basePrice: '95.00',
    descriptionHtml: '<p>A 60 cm floating shelf with hidden brackets. Holds up to 15 kg.</p>',
    weightGrams: 2400,
  },
  {
    title: 'Trail Running Socks (3-Pack)',
    vendor: 'Ridgeline Outdoor',
    productType: 'Socks',
    tags: ['apparel', 'running', 'merino'],
    basePrice: '24.00',
    descriptionHtml: '<p>Merino blend with a cushioned sole and a seamless toe.</p>',
    sizes: SHORT_SIZES,
    weightGrams: 120,
  },
  {
    title: 'Packable Rain Jacket',
    vendor: 'Ridgeline Outdoor',
    productType: 'Jackets',
    tags: ['apparel', 'outdoor', 'waterproof'],
    basePrice: '149.00',
    descriptionHtml:
      '<p>Three-layer waterproof shell that packs into its own pocket. Taped seams, adjustable hood.</p>',
    sizes: APPAREL_SIZES,
    colorways: [FOREST, NAVY, RUST],
    weightGrams: 310,
  },
  {
    title: 'Insulated Steel Bottle',
    vendor: 'Ridgeline Outdoor',
    productType: 'Bottles',
    tags: ['outdoor', 'drinkware', 'travel'],
    basePrice: '34.00',
    descriptionHtml: '<p>Double-wall stainless steel. Cold for 24 hours, hot for 12. 750 ml.</p>',
    colorways: [SLATE, FOREST, SAND],
    weightGrams: 390,
  },
  {
    title: 'Merino Beanie',
    vendor: 'Ridgeline Outdoor',
    productType: 'Hats',
    tags: ['apparel', 'wool', 'winter'],
    basePrice: '38.00',
    descriptionHtml: '<p>Rib-knit merino with a fold-over cuff. One size.</p>',
    colorways: [CHARCOAL, RUST, OAT, FOREST],
    weightGrams: 80,
  },
  {
    title: 'Sea Salt Soap Bar',
    vendor: 'Saltmarsh Supply',
    productType: 'Soap',
    tags: ['bath', 'natural', 'gift'],
    basePrice: '12.00',
    descriptionHtml: '<p>Cold-process olive oil soap with sea salt and rosemary. 120 g.</p>',
    weightGrams: 130,
  },
  {
    title: 'Linen Bath Towel',
    vendor: 'Saltmarsh Supply',
    productType: 'Towels',
    tags: ['bath', 'linen', 'home'],
    basePrice: '46.00',
    descriptionHtml: '<p>Waffle-weave linen that dries fast and gets softer with every wash.</p>',
    colorways: [OAT, SAGE, CLAY],
    weightGrams: 480,
  },
  {
    title: 'Botanical Hand Cream',
    vendor: 'Saltmarsh Supply',
    productType: 'Skin care',
    tags: ['bath', 'natural', 'skin care'],
    basePrice: '19.00',
    descriptionHtml: '<p>Shea butter and calendula in a 75 ml aluminium tube.</p>',
    weightGrams: 95,
  },
  {
    title: 'Cotton Market Bag',
    vendor: 'Saltmarsh Supply',
    productType: 'Bags',
    tags: ['accessories', 'cotton', 'carry'],
    basePrice: '18.00',
    descriptionHtml: '<p>Organic cotton net bag that stretches to carry a full shop.</p>',
    colorways: [IVORY, SAGE, NAVY],
    weightGrams: 90,
  },
];
