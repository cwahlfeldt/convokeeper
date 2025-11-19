/**
 * License Configuration
 * Defines which features are behind the paywall
 */

export const LICENSE_CONFIG = {
  storageKey: 'convokeep_license_status',

  // Features that require a license
  premiumFeatures: {
    EXPORT_CONVERSATIONS: 'export_conversations',
    ADVANCED_SEARCH: 'advanced_search',
    BATCH_OPERATIONS: 'batch_operations',
    ENHANCED_ORGANIZATION: 'enhanced_organization',
    CUSTOM_THEMES: 'custom_themes',
    CLOUD_SYNC: 'cloud_sync', // Future feature
    AI_ANALYSIS: 'ai_analysis' // Future feature
  },

  // Feature descriptions for UI
  featureDescriptions: {
    export_conversations: 'Export conversations to JSON, Markdown, or PDF formats. Export by tag, starred status, or custom filters.',
    advanced_search: 'Advanced search with filters and regex support',
    batch_operations: 'Bulk delete, archive, star, and tag multiple conversations at once',
    enhanced_organization: 'Tag conversations, star favorites, archive old chats, and filter by tags or status',
    custom_themes: 'Create and import custom color themes',
    cloud_sync: 'Sync conversations across devices (coming soon)',
    ai_analysis: 'AI-powered conversation insights (coming soon)'
  }
};
