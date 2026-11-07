import {
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ASK_ACCOUNT_LIMIT_MESSAGE,
  ASK_ALREADY_REPLIED,
  ASK_CONVERSATION_FULL,
  ASK_CONVERSATION_NOT_FOUND,
  ASK_ESCALATION_LIMIT_MESSAGE,
  ASK_ESCALATION_NOT_FOUND,
  ASK_TURNED_OFF_MESSAGE,
  askDailyLimitMessage,
} from '../ask.constants.js';

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

/**
 * The conversation does not exist, expired, or belongs to another caller. All three look the
 * same, so a conversation id never tells whether someone else is using it.
 */
export class AskConversationNotFoundError extends NotFoundException {
  constructor() {
    super(ASK_CONVERSATION_NOT_FOUND);
  }
}

/** The conversation holds as many questions as one may. */
export class AskConversationFullError extends ConflictException {
  constructor() {
    super(ASK_CONVERSATION_FULL);
  }
}

/** No escalation has this ticket id (or this admin id). */
export class AskEscalationNotFoundError extends NotFoundException {
  constructor() {
    super(ASK_ESCALATION_NOT_FOUND);
  }
}

/** Another admin replied to the escalation first. */
export class AskEscalationAlreadyRepliedError extends ConflictException {
  constructor() {
    super(ASK_ALREADY_REPLIED);
  }
}

/** The caller opened as many escalations as one may today. */
export class AskEscalationLimitReachedError extends HttpException {
  constructor() {
    super(ASK_ESCALATION_LIMIT_MESSAGE, HttpStatus.TOO_MANY_REQUESTS);
  }
}

/** The workspace asked about its account as many times as it may today. */
export class AskAccountLimitReachedError extends HttpException {
  constructor() {
    super(ASK_ACCOUNT_LIMIT_MESSAGE, HttpStatus.TOO_MANY_REQUESTS);
  }
}
