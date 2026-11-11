/** Where a step stands for the account. */
export enum GettingStartedStepState {
  Done = 'done',
  /** It can be taken now. */
  Todo = 'todo',
  /** It waits for an earlier step, such as publishing for a connected store. */
  Blocked = 'blocked',
}
