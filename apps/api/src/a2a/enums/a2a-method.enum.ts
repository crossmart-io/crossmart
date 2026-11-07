/** The JSON-RPC methods of A2A 1.0 (§9.4), PascalCase as on the wire. */
export enum A2aMethod {
  SendMessage = 'SendMessage',
  SendStreamingMessage = 'SendStreamingMessage',
  GetTask = 'GetTask',
  ListTasks = 'ListTasks',
  CancelTask = 'CancelTask',
  SubscribeToTask = 'SubscribeToTask',
  CreateTaskPushNotificationConfig = 'CreateTaskPushNotificationConfig',
  GetTaskPushNotificationConfig = 'GetTaskPushNotificationConfig',
  ListTaskPushNotificationConfigs = 'ListTaskPushNotificationConfigs',
  DeleteTaskPushNotificationConfig = 'DeleteTaskPushNotificationConfig',
  GetExtendedAgentCard = 'GetExtendedAgentCard',
}
