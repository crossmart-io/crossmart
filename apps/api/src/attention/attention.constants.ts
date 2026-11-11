import { AttentionSection, WorkspacePermission } from '@crossmart/core';

export const ATTENTION_TAG = 'Attention';
export const ATTENTION_ROUTE = 'workspaces/:workspaceId/attention';

/** Schema names the generated clients use for the attention enums. */
export const ATTENTION_STORE_REASON_SCHEMA_NAME = 'AttentionStoreReason';

/** The permission each section needs: the same one as the page it links to. */
export const ATTENTION_SECTION_PERMISSIONS: Readonly<
  Record<AttentionSection, WorkspacePermission>
> = {
  [AttentionSection.Stores]: WorkspacePermission.ViewChannels,
  [AttentionSection.Listings]: WorkspacePermission.ViewChannels,
  [AttentionSection.Proposals]: WorkspacePermission.ViewSuggestions,
  [AttentionSection.Suggestions]: WorkspacePermission.ViewSuggestions,
};
