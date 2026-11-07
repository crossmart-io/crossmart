import { Injectable } from '@nestjs/common';
import { isUniqueViolation, PrismaService } from '@crossmart/database';

/** Provider webhook events already handled, so a redelivered or concurrent copy is skipped. */
@Injectable()
export class BillingEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Marks the event as being handled. False when it already was, or is right now elsewhere. */
  async claim(eventId: string, type: string): Promise<boolean> {
    try {
      await this.prisma.billingWebhookEvent.create({ data: { id: eventId, type } });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  /** Lets the provider's retry handle the event again, after handling it failed. */
  async release(eventId: string): Promise<void> {
    await this.prisma.billingWebhookEvent.deleteMany({ where: { id: eventId } });
  }
}
