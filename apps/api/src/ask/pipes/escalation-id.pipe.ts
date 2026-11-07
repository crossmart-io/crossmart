import { Injectable, type PipeTransform } from '@nestjs/common';
import { ASK_TOKEN_MAX_LENGTH, AskEscalationNotFoundError } from '@crossmart/core';
import { ESCALATION_ID_PATTERN } from '../dto/ask-ids.js';

/** An escalation ticket id; anything else is a 404, like an unknown ticket. */
@Injectable()
export class EscalationIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (value.length > ASK_TOKEN_MAX_LENGTH || !ESCALATION_ID_PATTERN.test(value)) {
      throw new AskEscalationNotFoundError();
    }
    return value;
  }
}
