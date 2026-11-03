import { IMPORT_STALLED_REASON } from '../channel-import.constants.js';

/** An import whose worker stopped before it finished, closed by the sweep. */
export class StalledImportError extends Error {
  override readonly name = 'StalledImportError';

  constructor() {
    super(IMPORT_STALLED_REASON);
  }
}
