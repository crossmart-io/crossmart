/** What `create_account` did. The two answers never say whether an address is a customer. */
export enum SandboxOpeningOutcome {
  /** A sandbox account was opened, the agent got its key, and the claim link was emailed. */
  Created = 'created',
  /**
   * Nothing was created and no email was sent: the address cannot get a new sandbox. The agent
   * should ask the person to sign in and connect it through OAuth.
   */
  SignInRequired = 'sign_in_required',
}
