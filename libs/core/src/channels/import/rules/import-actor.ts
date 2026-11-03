import { Actor } from '../../../activity/entities/actor.js';

interface JobAuthor {
  userId: string | null;
  apiKeyId: string | null;
}

/** Who started an import, as stored on its job: every change it makes is credited to them. */
export function toImportActor({ userId, apiKeyId }: JobAuthor): Actor {
  if (userId) return Actor.user(userId);
  if (apiKeyId) return Actor.apiKey(apiKeyId);
  return Actor.system();
}
