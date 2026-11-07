/** Why Ask offered, or was asked for, a person. */
export enum AskEscalationReason {
  /** The sources do not answer the question. */
  Unanswered = 'unanswered',
  /** The answer's confidence is low. */
  LowConfidence = 'low_confidence',
  /** The caller asked for a person. */
  HumanRequested = 'human_requested',
  /** A sales question: Enterprise, custom terms, a demo. */
  Sales = 'sales',
}
