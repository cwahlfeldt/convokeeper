/**
 * Feature Manager
 * Handles feature flag checking and license validation
 */

import { LICENSE_CONFIG } from './licenseConfig.js';

class FeatureManager {
  constructor() {
    this.isLicensed = this._checkLicenseStatus();
    this._initializeEventListeners();
  }

  /**
   * Check if the app is licensed
   * @private
   * @returns {boolean} True if licensed
   */
  _checkLicenseStatus() {
    try {
      const stored = localStorage.getItem(LICENSE_CONFIG.storageKey);
      if (!stored) return false;

      const licenseData = JSON.parse(stored);

      // For now, just check if valid flag exists
      // Later: validate cryptographic signature here
      return licenseData.isValid === true;
    } catch (error) {
      console.error('Error checking license status:', error);
      return false;
    }
  }

  /**
   * Check if a specific feature is unlocked
   * @param {string} featureKey - Feature key from LICENSE_CONFIG.premiumFeatures
   * @returns {boolean} True if feature is available
   */
  hasFeature(featureKey) {
    // If licensed, all features are available
    if (this.isLicensed) {
      return true;
    }

    // Check if this is a premium feature
    const isPremiumFeature = Object.values(LICENSE_CONFIG.premiumFeatures).includes(featureKey);

    // If not a premium feature, it's available to everyone
    return !isPremiumFeature;
  }

  /**
   * Get license status
   * @returns {Object} License status information
   */
  getLicenseStatus() {
    return {
      isLicensed: this.isLicensed,
      features: this._getFeatureList()
    };
  }

  /**
   * Get list of all features with their availability
   * @private
   * @returns {Array} Array of feature objects
   */
  _getFeatureList() {
    return Object.entries(LICENSE_CONFIG.premiumFeatures).map(([name, key]) => ({
      name,
      key,
      description: LICENSE_CONFIG.featureDescriptions[key] || '',
      available: this.hasFeature(key)
    }));
  }

  /**
   * Activate license (for testing - will be replaced with real validation)
   * @param {string} licenseKey - License key to activate
   * @returns {Object} Activation result
   */
  activateLicense(licenseKey) {
    try {
      // TODO: Replace with cryptographic validation
      // For now, accept any non-empty key for testing
      if (!licenseKey || licenseKey.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid license key'
        };
      }

      // Store license data
      const licenseData = {
        isValid: true,
        key: licenseKey,
        activatedAt: new Date().toISOString()
        // TODO: Add signature validation data
      };

      localStorage.setItem(LICENSE_CONFIG.storageKey, JSON.stringify(licenseData));
      this.isLicensed = true;

      // Dispatch event so UI can update
      this._dispatchLicenseChangeEvent();

      return {
        success: true,
        message: 'License activated successfully'
      };
    } catch (error) {
      console.error('Error activating license:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Deactivate license
   */
  deactivateLicense() {
    localStorage.removeItem(LICENSE_CONFIG.storageKey);
    this.isLicensed = false;
    this._dispatchLicenseChangeEvent();
  }

  /**
   * Dispatch license change event
   * @private
   */
  _dispatchLicenseChangeEvent() {
    window.dispatchEvent(new CustomEvent('licenseStatusChanged', {
      detail: this.getLicenseStatus()
    }));
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initializeEventListeners() {
    // Listen for storage changes in other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === LICENSE_CONFIG.storageKey) {
        this.isLicensed = this._checkLicenseStatus();
        this._dispatchLicenseChangeEvent();
      }
    });
  }

  /**
   * Require a feature (throws error if not available)
   * @param {string} featureKey - Feature key to require
   * @throws {Error} If feature is not available
   */
  requireFeature(featureKey) {
    if (!this.hasFeature(featureKey)) {
      const description = LICENSE_CONFIG.featureDescriptions[featureKey] || featureKey;
      throw new Error(`This feature requires a license: ${description}`);
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Get the FeatureManager singleton instance
 * @returns {FeatureManager}
 */
export function getFeatureManager() {
  if (!instance) {
    instance = new FeatureManager();
  }
  return instance;
}
