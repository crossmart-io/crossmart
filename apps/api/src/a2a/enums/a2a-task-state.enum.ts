/** A task's state, serialized as ProtoJSON enum names (A2A 1.0 §4.1.3, §5.5). */
export enum A2aTaskState {
  Submitted = 'TASK_STATE_SUBMITTED',
  Working = 'TASK_STATE_WORKING',
  Completed = 'TASK_STATE_COMPLETED',
  Failed = 'TASK_STATE_FAILED',
  Canceled = 'TASK_STATE_CANCELED',
  InputRequired = 'TASK_STATE_INPUT_REQUIRED',
  Rejected = 'TASK_STATE_REJECTED',
  AuthRequired = 'TASK_STATE_AUTH_REQUIRED',
}
