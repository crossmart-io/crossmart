import type { z } from 'zod';
import type { AiCompletion } from '../entities/ai-completion.js';
import { AiStopReason } from '../enums/ai-stop-reason.enum.js';
import { AiOutputRejectedError } from '../errors/ai.errors.js';

const NOT_JSON = 'the answer is not JSON';
const ISSUE_SEPARATOR = ', ';
const ROOT_PATH = '(root)';
const PATH_SEPARATOR = '.';

/** Names where the answer broke the schema ("title, description"), never what it said. */
function describeIssues(error: z.ZodError): string {
  const paths = error.issues.map((issue) => issue.path.join(PATH_SEPARATOR) || ROOT_PATH);
  return `the answer does not match its schema at ${[...new Set(paths)].join(ISSUE_SEPARATOR)}`;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new AiOutputRejectedError(NOT_JSON);
  }
}

/**
 * The validated output of a completion. Free text is never trusted: an answer that was
 * refused, cut off, is not JSON or breaks the schema is rejected, so nothing from it is stored.
 */
export function parseStructuredOutput<Output>(
  completion: AiCompletion,
  schema: z.ZodType<Output>,
): Output {
  if (completion.stopReason !== AiStopReason.Completed) {
    throw new AiOutputRejectedError(`the model stopped: ${completion.stopReason}`);
  }
  const result = schema.safeParse(parseJson(completion.text));
  if (!result.success) {
    throw new AiOutputRejectedError(describeIssues(result.error));
  }
  return result.data;
}
