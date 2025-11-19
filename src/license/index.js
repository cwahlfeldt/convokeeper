/**
 * License Module
 * Public API for license and feature management
 */

export { LICENSE_CONFIG } from './licenseConfig.js';
export { getFeatureManager } from './featureManager.js';
export {
  applyFeatureGating,
  showUpgradePrompt,
  showLicenseKeyPrompt,
  showLicenseInfo,
  withFeature,
  initLicenseUI
} from './uiHelpers.js';
