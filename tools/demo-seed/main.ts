/**
 * Fills a local Crossmart with a demo catalog, through the public API.
 *
 *   pnpm seed:demo
 *
 * Needs a running API (`pnpm start:api`). Safe to run twice: it stops when the demo
 * workspace already has products. For local development only.
 */
import { DemoApiClient, type DemoAccount } from './api-client.js';
import { DEMO_PRODUCTS } from './demo-catalog.js';
import { photosFor, productBody } from './product-factory.js';
import { DEMO_SEED, SeededRandom } from './seeded-random.js';
import { swatchPng } from './swatch-png.js';

const DEFAULT_API_URL = 'http://localhost:3000';
const STATUS_COLUMN_WIDTH = 8;

/** A CLI reports on stdout; the API's structured logger is for servers. */
function variantsLabel(count: number): string {
  return `${count} ${count === 1 ? 'variant' : 'variants'}`;
}

function report(line: string): void {
  process.stdout.write(`${line}\n`);
}

/** A local demo login, printed at the end. Never use it on a server anyone else can reach. */
const DEFAULT_ACCOUNT: DemoAccount = {
  name: 'Demo Seller',
  email: 'demo@crossmart.local',
  password: 'crossmart-demo',
};

function accountFromEnv(): DemoAccount {
  return {
    name: DEFAULT_ACCOUNT.name,
    email: process.env.DEMO_EMAIL ?? DEFAULT_ACCOUNT.email,
    password: process.env.DEMO_PASSWORD ?? DEFAULT_ACCOUNT.password,
  };
}

async function seed(): Promise<void> {
  const apiUrl = process.env.API_URL ?? DEFAULT_API_URL;
  const account = accountFromEnv();
  const client = new DemoApiClient(apiUrl);
  await client.signIn(account);
  const workspace = await client.firstWorkspace();

  if ((await client.productCount(workspace.id)) > 0) {
    report(`${workspace.name} already has products. Nothing to do.`);
    return;
  }

  const random = new SeededRandom(DEMO_SEED);
  let variantCount = 0;
  for (const blueprint of DEMO_PRODUCTS) {
    const media = await Promise.all(
      photosFor(blueprint, random).map(async (photo, index) => ({
        url: await client.uploadImage(
          workspace.id,
          swatchPng(photo.colorway.hex),
          `photo-${index}.png`,
        ),
        altText: photo.altText,
      })),
    );
    const body = productBody(blueprint, media, random);
    await client.createProduct(workspace.id, body);
    variantCount += body.variants.length;
    report(
      `  ${body.status.padEnd(STATUS_COLUMN_WIDTH)} ${body.title} (${variantsLabel(body.variants.length)})`,
    );
  }

  report(`\nSeeded ${DEMO_PRODUCTS.length} products and ${variantsLabel(variantCount)}.`);
  report(`Sign in at the web app as ${account.email} / ${account.password}`);
}

seed().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
