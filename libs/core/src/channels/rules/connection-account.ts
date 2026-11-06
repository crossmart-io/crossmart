import { BadRequestException } from '@nestjs/common';
import type { ChannelSettings } from '@crossmart/connectors';
import type { Actor } from '../../activity/entities/actor.js';
import type { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import type { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { ChannelConnectionView } from '../entities/channel-connection-view.js';
import type { ConnectionAccountStore } from '../services/connection-account.store.js';
import { connectionSubject } from './connection-subject.js';

/** Which channel's account settings a setup service works on. */
export interface ConnectionAccountKind<TSettings extends ChannelSettings> {
  isAccount(settings: ChannelSettings): settings is TSettings;
  /** Why another channel's connection, or one whose account was never read, is refused. */
  notThisChannel: string;
}

/** A connection and its account settings, of the channel a setup service works on. */
export interface ConnectionAccount<TSettings extends ChannelSettings> {
  connection: ChannelConnectionView;
  settings: TSettings;
}

/** Reads a connection and its account settings; 400 when they are not `kind`'s. */
export async function loadConnectionAccount<TSettings extends ChannelSettings>(
  store: ConnectionAccountStore,
  workspaceId: string,
  connectionId: string,
  kind: ConnectionAccountKind<TSettings>,
): Promise<ConnectionAccount<TSettings>> {
  const connection = await store.get(workspaceId, connectionId);
  const { account } = connection.settings;
  if (!account || !kind.isAccount(account)) {
    throw new BadRequestException(kind.notThisChannel);
  }
  return { connection, settings: account };
}

/** Records a change to a connection's setup, with the connection as its subject. */
export function recordConnectionChange(
  activity: ActivityRecorder,
  workspaceId: string,
  actor: Actor,
  change: { action: ActivityAction; connection: ChannelConnectionView },
): Promise<void> {
  return activity.record(workspaceId, actor, {
    action: change.action,
    subject: connectionSubject(change.connection),
  });
}
