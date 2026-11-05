import { NotFoundException } from '@nestjs/common';
import { describeError, MAX_LOGGED_ERROR_MESSAGE_LENGTH } from './describe-error.js';

class CodedTestError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'CodedTestError';
  }
}

describe('describeError', () => {
  it('keeps the code and message of an error with a code', () => {
    expect(describeError(new CodedTestError('RATE_LIMITED', 'Slow down'))).toBe(
      'CodedTestError RATE_LIMITED: Slow down',
    );
  });

  it('keeps the status and message of an HTTP exception', () => {
    expect(describeError(new NotFoundException('Listing not found'))).toBe(
      'NotFoundException 404: Listing not found',
    );
  });

  it('names any other error by its type only, never its message', () => {
    const description = describeError(new TypeError('Bearer secret-token in body'));

    expect(description).toBe('TypeError');
  });

  it('describes a thrown value that is not an error by its type', () => {
    expect(describeError('token=abc')).toBe('string');
  });

  it('puts long messages on one bounded line', () => {
    const description = describeError(
      new CodedTestError('P2025', `first\n\n${'x'.repeat(MAX_LOGGED_ERROR_MESSAGE_LENGTH)}`),
    );

    expect(description).not.toContain('\n');
    expect(description.length).toBeLessThan(MAX_LOGGED_ERROR_MESSAGE_LENGTH + 40);
  });
});
