import type { ChannelError } from './channel-error.js';
import type { ChannelErrorCode } from './channel-error-code.enum.js';

/** Builds a connector's `ChannelError`s, such as `ebayError`. */
export type ChannelErrorFactory = (code: ChannelErrorCode, message: string) => ChannelError;

/** A merchant-readable message for every error code; never a response body or a token. */
export type ChannelErrorMessages = Readonly<Record<ChannelErrorCode, string>>;
