import { z } from 'zod';
import { MAX_PAGE_SIZE, SEARCH_MAX_LENGTH } from '../mcp.constants.js';

/** Input pieces several tools share. */
export const PAGE_INPUT = {
  page: z.number().int().min(1).optional().describe('Page number, starting at 1'),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).optional().describe('Rows per page'),
};

export const SEARCH_INPUT = z.string().max(SEARCH_MAX_LENGTH).optional();

export const ID_INPUT = z.uuid();

/** A money amount as the API takes it: digits with up to two decimals, such as "19.90". */
export const AMOUNT_INPUT = z.string().regex(/^\d{1,10}(\.\d{1,2})?$/, 'An amount such as 19.90');
