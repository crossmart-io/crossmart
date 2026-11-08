/** Why a streamed turn stopped with an error, for clients to react to. */
export enum AgentWorkerErrorCode {
  /** The plan's AI credits for this month are used up. */
  CreditsExhausted = 'credits_exhausted',
  /** AI is not configured on this server, or the provider is unavailable. */
  AiUnavailable = 'ai_unavailable',
  /** An unclaimed sandbox account; Crossmart's AI waits for the claim. */
  SandboxClaimRequired = 'sandbox_claim_required',
  /** The model refused or its answer was cut off. */
  AnswerUnusable = 'answer_unusable',
  Internal = 'internal',
}
