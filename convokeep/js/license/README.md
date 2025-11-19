# License Module

This module provides feature gating and license management for ConvoKeep Premium features.

## Overview

The license system allows you to:
- Gate features behind a paywall
- Validate license keys (currently basic, will be cryptographic later)
- Show upgrade prompts for locked features
- Manage premium feature access

## Quick Start

### 1. Define Premium Features

Edit `licenseConfig.js` to add new premium features:

```javascript
premiumFeatures: {
  EXPORT_CONVERSATIONS: 'export_conversations',
  YOUR_NEW_FEATURE: 'your_new_feature',
}
```

### 2. Gate Features in HTML

Use data attributes to automatically hide/disable elements:

```html
<!-- Hide feature completely (removed from DOM) -->
<button data-feature="export_conversations">
  Export to PDF
</button>

<!-- Disable feature but keep visible (shows lock icon) -->
<button data-feature="advanced_search" data-feature-mode="disable">
  Advanced Search
</button>
```

### 3. Gate Features in JavaScript

Check feature availability before executing code:

```javascript
import { getFeatureManager, withFeature } from './license/index.js';

const featureManager = getFeatureManager();

// Check if feature is available
if (featureManager.hasFeature('export_conversations')) {
  // Execute premium feature
  exportConversations();
} else {
  // Show upgrade prompt
  showUpgradePrompt('export_conversations');
}

// Or use the helper function
withFeature('export_conversations', () => {
  // This will only execute if feature is unlocked
  exportConversations();
});
```

### 4. Require Features (Throw Error if Locked)

```javascript
import { getFeatureManager } from './license/index.js';

function exportToPDF() {
  const featureManager = getFeatureManager();

  // This will throw an error if the feature is locked
  featureManager.requireFeature('export_conversations');

  // Continue with the feature...
}
```

## API Reference

### `getFeatureManager()`

Returns the singleton FeatureManager instance.

```javascript
const featureManager = getFeatureManager();
```

### `FeatureManager.hasFeature(featureKey)`

Check if a feature is available.

```javascript
if (featureManager.hasFeature('export_conversations')) {
  // Feature is available
}
```

### `FeatureManager.getLicenseStatus()`

Get current license status and feature list.

```javascript
const status = featureManager.getLicenseStatus();
console.log(status.isLicensed); // true or false
console.log(status.features);   // Array of features with availability
```

### `FeatureManager.activateLicense(key)`

Activate a license key (for testing now, will be cryptographic later).

```javascript
const result = featureManager.activateLicense('test-key-12345');
if (result.success) {
  console.log('License activated!');
}
```

### `FeatureManager.deactivateLicense()`

Deactivate the current license.

```javascript
featureManager.deactivateLicense();
```

## UI Helpers

### `initLicenseUI()`

Initialize license UI system. This should be called once on app startup.

```javascript
import { initLicenseUI } from './license/index.js';

initLicenseUI();
```

This will:
- Apply feature gating to all elements with `data-feature` attributes
- Listen for license status changes
- Auto-update UI when license is activated/deactivated

### `showLicenseInfo()`

Show the license information modal with pricing and features.

```javascript
import { showLicenseInfo } from './license/index.js';

// Show license modal
showLicenseInfo();
```

### `showLicenseKeyPrompt()`

Show the license key input prompt.

```javascript
import { showLicenseKeyPrompt } from './license/index.js';

showLicenseKeyPrompt();
```

### `showUpgradePrompt(featureKey)`

Show an upgrade prompt for a specific locked feature.

```javascript
import { showUpgradePrompt } from './license/index.js';

showUpgradePrompt('export_conversations');
```

### `withFeature(featureKey, callback)`

Execute a callback only if the feature is available, otherwise show upgrade prompt.

```javascript
import { withFeature } from './license/index.js';

withFeature('export_conversations', () => {
  // This code only runs if the feature is unlocked
  exportConversations();
});
```

## Example: Adding a New Premium Feature

Let's add a "Batch Delete" feature:

### Step 1: Add to config

```javascript
// js/license/licenseConfig.js
export const LICENSE_CONFIG = {
  // ...
  premiumFeatures: {
    // ...existing features
    BATCH_DELETE: 'batch_delete',
  },
  featureDescriptions: {
    // ...existing descriptions
    batch_delete: 'Delete multiple conversations at once',
  }
};
```

### Step 2: Add button to HTML

```html
<button
  id="batch-delete-btn"
  data-feature="batch_delete"
  data-feature-mode="disable"
  class="button-danger">
  Delete Selected
</button>
```

### Step 3: Add logic in JavaScript

```javascript
import { withFeature } from './license/index.js';

document.getElementById('batch-delete-btn').addEventListener('click', () => {
  withFeature('batch_delete', () => {
    // Get selected conversations
    const selected = getSelectedConversations();

    // Confirm deletion
    if (confirm(`Delete ${selected.length} conversations?`)) {
      deleteConversations(selected);
    }
  });
});
```

That's it! The button will automatically show a lock icon if the user doesn't have a license, and clicking it will show an upgrade prompt.

## Events

The license system dispatches a custom event when the license status changes:

```javascript
window.addEventListener('licenseStatusChanged', (event) => {
  const { isLicensed, features } = event.detail;
  console.log('License status changed:', isLicensed);

  // Update UI based on new license status
  updateMyCustomUI();
});
```

## Testing

For testing purposes, any non-empty string will activate the license:

```javascript
const featureManager = getFeatureManager();
featureManager.activateLicense('test-key');
// All features are now unlocked
```

## Future: Cryptographic Validation

When we implement proper license validation, the `activateLicense()` method will:

1. Parse the license key
2. Verify the cryptographic signature using the embedded public key
3. Check key validity (not expired, not revoked, etc.)
4. Store validated license data in localStorage

The validation will be client-side only, maintaining ConvoKeep's zero-backend architecture.

## Storage

License data is stored in localStorage under the key `convokeep_license_status`:

```javascript
{
  "isValid": true,
  "key": "LICENSE-KEY-HERE",
  "activatedAt": "2025-01-15T10:30:00.000Z"
  // Future: signature validation data
}
```

## Privacy

The license system maintains ConvoKeep's privacy-first approach:
- No phone-home validation
- No tracking or analytics
- All validation happens client-side
- License keys are stored locally only
- No user identification or data collection
