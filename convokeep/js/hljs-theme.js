/**
 * Highlight.js Theme Loader
 *
 * Loads the appropriate Catppuccin theme based on the current theme setting
 */

(function() {
  'use strict';

  function loadHighlightTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const themeLink = document.getElementById('hljs-theme');

    if (isDark && themeLink) {
      themeLink.href = 'lib/catppuccin/catppuccin-mocha.css';
    }
  }

  // Load theme when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHighlightTheme);
  } else {
    loadHighlightTheme();
  }
})();
