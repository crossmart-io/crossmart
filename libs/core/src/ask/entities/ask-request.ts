import type { AskChannel } from '../enums/ask-channel.enum.js';
import type { AskCaller } from './ask-caller.js';

/** One question to Ask Crossmart, possibly continuing a conversation. */
export interface AskRequest {
  question: string;
  /** The conversation to continue; a new one starts without it. */
  conversationId?: string;
  channel: AskChannel;
  caller: AskCaller;
}
