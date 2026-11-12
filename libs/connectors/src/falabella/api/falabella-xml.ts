import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { FALABELLA_XML_DECLARATION } from '../falabella.constants.js';

/**
 * Values are kept as text (`parseTagValue: false`), as Seller Center sends ids such as
 * `0012` and prices such as `1600.00`; schemas convert what they need. Empty elements read as
 * an empty string.
 */
const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true });

/** Text is escaped, so a description's HTML travels as character data, as Falabella asks. */
const builder = new XMLBuilder({ ignoreAttributes: true, processEntities: true });

/** An XML document as a plain object; throws on a document that is not well formed. */
export function parseFalabellaXml(xml: string): unknown {
  return parser.parse(xml, true);
}

/** An XML request body: the declaration, then `<Request>` holding `content`. */
export function buildFalabellaRequest(content: Readonly<Record<string, unknown>>): string {
  return `${FALABELLA_XML_DECLARATION}${String(builder.build({ Request: content }))}`;
}

/**
 * A repeated element. XML cannot tell a list of one from a single element, and an empty list
 * is an empty element (`<FeedErrors/>`), so all three read as an array.
 */
export function xmlList<TItem extends z.ZodType>(item: TItem): z.ZodType<z.output<TItem>[]> {
  return z.preprocess((value) => {
    if (value === '' || value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }, z.array(item));
}

/** An element with children, which reads as an empty string when it has none (`<Children/>`). */
export function xmlObject<TShape extends z.ZodRawShape>(
  shape: TShape,
): z.ZodType<z.output<z.ZodObject<TShape>>> {
  return z.preprocess((value) => (value === '' ? {} : value), z.object(shape));
}

/** Text that may be empty (`<ProductId/>`); null when it is. */
export const xmlOptionalText = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().nullable(),
);

/** A whole number sent as text. */
export const xmlInteger = z.coerce.number().int();
