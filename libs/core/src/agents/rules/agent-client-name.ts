/**
 * The name to show for an agent: the one its metadata gives, else the host of its client id
 * when that is a metadata document URL, else the id itself.
 */
export function agentClientName(clientId: string, name: string | null | undefined): string {
  if (name?.trim()) return name.trim();
  try {
    return new URL(clientId).host;
  } catch {
    return clientId;
  }
}
