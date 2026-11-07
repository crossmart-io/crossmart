/** How a claim with a new password ended. */
export enum SandboxClaimOutcome {
  Claimed = 'claimed',
  /** The link is unknown, used or expired. */
  InvalidLink = 'invalid_link',
  /** The person set a password meanwhile; they sign in and claim from the app instead. */
  PasswordAlreadySet = 'password_already_set',
}
