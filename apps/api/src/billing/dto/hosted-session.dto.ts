import { ApiProperty } from '@nestjs/swagger';
import type { HostedSession } from '@crossmart/core';

/** A page the billing provider hosts; send the browser there. */
export class HostedSessionDto {
  @ApiProperty({ format: 'uri', example: 'https://checkout.stripe.com/c/pay/cs_test_…' })
  url: string;

  static from(session: HostedSession): HostedSessionDto {
    return Object.assign(new HostedSessionDto(), { url: session.url });
  }
}
