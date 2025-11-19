/**
 * UI Helpers for License Features
 * Utilities to gate UI elements based on license status
 */

import { getFeatureManager } from './featureManager.js';
import { LICENSE_CONFIG } from './licenseConfig.js';

/**
 * Apply feature gating to elements with data-feature attribute
 * Elements will be hidden/disabled if feature is not available
 */
export function applyFeatureGating() {
  const featureManager = getFeatureManager();

  // Find all elements with data-feature attribute
  const featureElements = document.querySelectorAll('[data-feature]');

  featureElements.forEach(element => {
    const featureKey = element.getAttribute('data-feature');
    const hasFeature = featureManager.hasFeature(featureKey);
    const gatingMode = element.getAttribute('data-feature-mode') || 'hide'; // 'hide' or 'disable'

    if (!hasFeature) {
      if (gatingMode === 'disable') {
        // Disable the element but keep it visible
        element.disabled = true;
        element.classList.add('feature-locked');
        element.setAttribute('aria-disabled', 'true');

        // Add lock icon if it's a button
        if (element.tagName === 'BUTTON' && !element.querySelector('.lock-icon')) {
          const lockIcon = document.createElement('span');
          lockIcon.className = 'lock-icon';
          lockIcon.textContent = '🔒';
          lockIcon.setAttribute('aria-hidden', 'true');
          element.prepend(lockIcon);
        }

        // Add click handler to show upgrade message
        element.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          showUpgradePrompt(featureKey);
        });
      } else {
        // Hide the element completely
        element.style.display = 'none';
        element.setAttribute('aria-hidden', 'true');
      }
    } else {
      // Feature is available - ensure element is visible/enabled
      if (gatingMode === 'disable') {
        element.disabled = false;
        element.classList.remove('feature-locked');
        element.removeAttribute('aria-disabled');

        // Remove lock icon if present
        const lockIcon = element.querySelector('.lock-icon');
        if (lockIcon) {
          lockIcon.remove();
        }
      } else {
        element.style.display = '';
        element.removeAttribute('aria-hidden');
      }
    }
  });
}

/**
 * Show upgrade prompt for a locked feature
 * @param {string} featureKey - The feature that was attempted to access
 */
export function showUpgradePrompt(featureKey) {
  const description = LICENSE_CONFIG.featureDescriptions[featureKey] || 'This feature';

  const message = `
    <div class="upgrade-prompt">
      <h3>🔒 Premium Feature</h3>
      <p><strong>${description}</strong></p>
      <p>This feature requires a one-time purchase to unlock.</p>
      <div class="upgrade-actions">
        <button id="upgrade-learn-more" class="button-primary">Learn More</button>
        <button id="upgrade-enter-key" class="button-secondary">I Have a Key</button>
        <button id="upgrade-close" class="button-text">Close</button>
      </div>
    </div>
  `;

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content upgrade-modal">
      ${message}
    </div>
  `;

  document.body.appendChild(overlay);

  // Add event listeners
  overlay.querySelector('#upgrade-close').addEventListener('click', () => {
    overlay.remove();
  });

  overlay.querySelector('#upgrade-learn-more').addEventListener('click', () => {
    // TODO: Link to purchase page
    showLicenseInfo();
  });

  overlay.querySelector('#upgrade-enter-key').addEventListener('click', () => {
    overlay.remove();
    showLicenseKeyPrompt();
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  // Close on Escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

/**
 * Show license key input prompt
 */
export function showLicenseKeyPrompt() {
  const featureManager = getFeatureManager();

  const promptHtml = `
    <div class="license-key-prompt">
      <h3>Enter License Key</h3>
      <p>Enter your ConvoKeep license key to unlock all premium features.</p>
      <form id="license-key-form">
        <input
          type="text"
          id="license-key-input"
          placeholder="XXXX-XXXX-XXXX-XXXX"
          autocomplete="off"
          required
        />
        <div id="license-key-error" class="error-message" style="display: none;"></div>
        <div class="form-actions">
          <button type="submit" class="button-primary">Activate</button>
          <button type="button" id="license-key-cancel" class="button-text">Cancel</button>
        </div>
      </form>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-content license-modal">${promptHtml}</div>`;

  document.body.appendChild(overlay);

  const form = overlay.querySelector('#license-key-form');
  const input = overlay.querySelector('#license-key-input');
  const errorDiv = overlay.querySelector('#license-key-error');

  // Focus input
  setTimeout(() => input.focus(), 100);

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const key = input.value.trim();

    const result = featureManager.activateLicense(key);

    if (result.success) {
      overlay.remove();
      showSuccessMessage('License activated successfully! All features unlocked.');
      // Reapply feature gating to update UI
      applyFeatureGating();
    } else {
      errorDiv.textContent = result.error;
      errorDiv.style.display = 'block';
      input.classList.add('error');
    }
  });

  // Handle cancel
  overlay.querySelector('#license-key-cancel').addEventListener('click', () => {
    overlay.remove();
  });

  // Close on Escape
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

/**
 * Show license information and pricing
 */
export function showLicenseInfo() {
  const featureManager = getFeatureManager();
  const status = featureManager.getLicenseStatus();

  const featuresHtml = status.features
    .map(f => `
      <li class="${f.available ? 'feature-available' : 'feature-locked'}">
        <span class="feature-icon">${f.available ? '✓' : '🔒'}</span>
        <span class="feature-name">${f.description}</span>
      </li>
    `)
    .join('');

  const infoHtml = `
    <div class="license-info">
      <h2>ConvoKeep Premium</h2>
      <p class="license-tagline">One-time purchase. Lifetime access. Privacy-first.</p>

      <div class="license-status">
        <strong>Status:</strong>
        <span class="status-badge ${status.isLicensed ? 'status-active' : 'status-free'}">
          ${status.isLicensed ? '✓ Licensed' : 'Free Version'}
        </span>
      </div>

      <h3>Premium Features</h3>
      <ul class="features-list">
        ${featuresHtml}
      </ul>

      ${!status.isLicensed ? `
        <div class="pricing-info">
          <div class="price">$19.99</div>
          <p class="price-description">One-time payment • No subscription • All future updates included</p>
        </div>

        <div class="license-actions">
          <button id="license-purchase" class="button-primary">Purchase License</button>
          <button id="license-have-key" class="button-secondary">I Have a Key</button>
        </div>
      ` : `
        <div class="licensed-message">
          <p>✓ Thank you for supporting ConvoKeep!</p>
          <button id="license-manage" class="button-secondary">Manage License</button>
        </div>
      `}

      <button id="license-info-close" class="button-text">Close</button>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-content license-info-modal">${infoHtml}</div>`;

  document.body.appendChild(overlay);

  // Event listeners
  const purchaseBtn = overlay.querySelector('#license-purchase');
  if (purchaseBtn) {
    purchaseBtn.addEventListener('click', () => {
      // TODO: Link to actual purchase page (Gumroad, etc.)
      alert('Purchase page coming soon! For now, use any text as a license key for testing.');
      overlay.remove();
      showLicenseKeyPrompt();
    });
  }

  const haveKeyBtn = overlay.querySelector('#license-have-key');
  if (haveKeyBtn) {
    haveKeyBtn.addEventListener('click', () => {
      overlay.remove();
      showLicenseKeyPrompt();
    });
  }

  const manageBtn = overlay.querySelector('#license-manage');
  if (manageBtn) {
    manageBtn.addEventListener('click', () => {
      overlay.remove();
      showLicenseManagement();
    });
  }

  overlay.querySelector('#license-info-close').addEventListener('click', () => {
    overlay.remove();
  });

  // Close on Escape
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

/**
 * Show license management panel
 */
export function showLicenseManagement() {
  const featureManager = getFeatureManager();

  const managementHtml = `
    <div class="license-management">
      <h3>License Management</h3>
      <p>Your ConvoKeep license is active and all features are unlocked.</p>

      <div class="management-actions">
        <button id="license-deactivate" class="button-danger">Deactivate License</button>
        <button id="license-management-close" class="button-text">Close</button>
      </div>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-content">${managementHtml}</div>`;

  document.body.appendChild(overlay);

  overlay.querySelector('#license-deactivate').addEventListener('click', () => {
    if (confirm('Are you sure you want to deactivate your license? You can reactivate it anytime with your license key.')) {
      featureManager.deactivateLicense();
      overlay.remove();
      showSuccessMessage('License deactivated. Premium features are now locked.');
      applyFeatureGating();
    }
  });

  overlay.querySelector('#license-management-close').addEventListener('click', () => {
    overlay.remove();
  });
}

/**
 * Show success message
 * @param {string} message - Success message to display
 */
function showSuccessMessage(message) {
  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-show');
  }, 100);

  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Check if feature is available and execute callback or show prompt
 * @param {string} featureKey - Feature to check
 * @param {Function} callback - Function to execute if feature is available
 */
export function withFeature(featureKey, callback) {
  const featureManager = getFeatureManager();

  if (featureManager.hasFeature(featureKey)) {
    callback();
  } else {
    showUpgradePrompt(featureKey);
  }
}

/**
 * Initialize license UI
 * Applies feature gating and listens for license status changes
 */
export function initLicenseUI() {
  // Apply initial feature gating
  applyFeatureGating();

  // Listen for license status changes
  window.addEventListener('licenseStatusChanged', () => {
    applyFeatureGating();
  });

  // Reapply when DOM changes (for dynamically added elements)
  const observer = new MutationObserver(() => {
    applyFeatureGating();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
