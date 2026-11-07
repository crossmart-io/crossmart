import { AGENT_WORKER_TITLE_MAX_LENGTH } from '../agent-worker.constants.js';

const WHITESPACE = /\s+/g;
const ELLIPSIS = '…';

/** A conversation's title: its first message on one line, cut to fit. */
export function conversationTitle(firstMessage: string): string {
  const line = firstMessage.replace(WHITESPACE, ' ').trim();
  if (line.length <= AGENT_WORKER_TITLE_MAX_LENGTH) return line;
  return `${line.slice(0, AGENT_WORKER_TITLE_MAX_LENGTH - ELLIPSIS.length).trimEnd()}${ELLIPSIS}`;
}
