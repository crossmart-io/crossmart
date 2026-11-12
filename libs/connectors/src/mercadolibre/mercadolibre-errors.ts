import { ChannelType } from '../sdk/channel-type.enum.js';
import { ChannelError } from '../sdk/errors/channel-error.js';
import type { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';

export function mercadoLibreError(code: ChannelErrorCode, message: string): ChannelError {
  return new ChannelError(ChannelType.MercadoLibre, code, message);
}
