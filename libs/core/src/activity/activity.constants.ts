export const ACTIVITY_PAGE_DEFAULT_LIMIT = 25;
export const ACTIVITY_PAGE_MAX_LIMIT = 100;

/** Stored text is cut to these lengths so a long title or message cannot bloat the log. */
export const ACTIVITY_SUMMARY_MAX_LENGTH = 500;
export const ACTIVITY_LABEL_MAX_LENGTH = 255;
export const ACTIVITY_FAILURE_REASON_MAX_LENGTH = 500;
/** Subjects one bulk event keeps for their histories; matches the largest bulk selection. */
export const ACTIVITY_MAX_SUBJECT_IDS = 250;

/** Shown instead of internal error details, which may hold data that must not be stored. */
export const UNEXPECTED_FAILURE_REASON = 'An unexpected error occurred';
export const TRUNCATION_MARKER = '…';
