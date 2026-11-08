/**
 * Whose conversation it is: one person in one workspace. Every read and write of a conversation
 * is scoped by both, so nobody else, in or out of the workspace, can reach it.
 */
export interface AgentWorkerOwner {
  workspaceId: string;
  userId: string;
}

/** A conversation of an owner, as every turn and tool call knows it. */
export interface AgentWorkerScope extends AgentWorkerOwner {
  conversationId: string;
}
