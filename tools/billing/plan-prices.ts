import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { BillingInterval } from '@crossmart/database';

const CURRENCY_CODE_LENGTH = 3;

const PLAN_PRICES_SCHEMA = z.object({
  currency: z.string().length(CURRENCY_CODE_LENGTH),
  plans: z.record(
    z.string(),
    z.partialRecord(z.enum(BillingInterval), z.number().int().positive()),
  ),
});

/** What each plan sells at: amounts in minor units by plan code and interval. */
export type PlanPricesConfig = z.infer<typeof PLAN_PRICES_SCHEMA>;

/** Reads and checks the price list; a plan it leaves out is not sold online (Enterprise). */
export async function readPlanPrices(file: URL): Promise<PlanPricesConfig> {
  return PLAN_PRICES_SCHEMA.parse(JSON.parse(await readFile(file, 'utf8')));
}
