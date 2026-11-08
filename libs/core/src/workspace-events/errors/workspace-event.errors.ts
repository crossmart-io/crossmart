import { BadRequestException } from '@nestjs/common';
import { INVALID_EVENT_CURSOR } from '../workspace-events.constants.js';

/** A cursor (or `Last-Event-ID`) this API did not give out. */
export class InvalidEventCursorError extends BadRequestException {
  constructor() {
    super(INVALID_EVENT_CURSOR);
  }
}
