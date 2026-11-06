import { ServiceUnavailableException } from '@nestjs/common';
import { ASK_TURNED_OFF_MESSAGE, askDailyLimitMessage } from '../ask.constants.js';

/** The operator turned Ask off (`ASK_DAILY_QUESTION_CAP=0`). */
export class AskTurnedOffError extends ServiceUnavailableException {
  constructor() {
    super(ASK_TURNED_OFF_MESSAGE);
  }
}

/** Today's questions across the platform are spent; Ask answers again after midnight UTC. */
export class AskDailyLimitReachedError extends ServiceUnavailableException {
  constructor(supportEmail: string) {
    super(askDailyLimitMessage(supportEmail));
  }
}
