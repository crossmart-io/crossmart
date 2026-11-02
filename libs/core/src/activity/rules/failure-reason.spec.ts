import { BadRequestException } from '@nestjs/common';
import { UNEXPECTED_FAILURE_REASON } from '../activity.constants.js';
import { toFailureReason } from './failure-reason.js';

describe('toFailureReason', () => {
  it('keeps messages written for users', () => {
    expect(toFailureReason(new BadRequestException('The file is not a readable CSV'))).toBe(
      'The file is not a readable CSV',
    );
  });

  it('hides internal errors', () => {
    expect(toFailureReason(new Error('duplicate key value violates "users_email_key"'))).toBe(
      UNEXPECTED_FAILURE_REASON,
    );
  });
});
