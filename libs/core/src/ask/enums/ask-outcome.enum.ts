/** What kind of reply Ask gave. Only `Answered` carries text written by the model. */
export enum AskOutcome {
  /** Answered from the sources it cites. */
  Answered = 'answered',
  /** The sources do not answer it; the reply points to support. */
  Unknown = 'unknown',
  /** Not a question about Crossmart. */
  OutOfScope = 'out_of_scope',
}
