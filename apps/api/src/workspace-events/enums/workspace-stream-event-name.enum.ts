/** The names of the stream's server-sent events. */
export enum WorkspaceStreamEventName {
  /** One `WorkspaceEventDto`. */
  Event = 'workspace_event',
  /** Sent once the backlog is out: the stream is live from here. Its id is the cursor. */
  Ready = 'ready',
}
