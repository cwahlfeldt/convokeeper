/**
 * Menu Toggle Handler
 *
 * Handles the desktop menu toggle functionality
 */

(function() {
  'use strict';

  function initializeMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mainMenu = document.getElementById('main-menu');

    if (!menuToggle || !mainMenu) {
      return;
    }

    // Toggle menu on click
    menuToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      const isActive = mainMenu.classList.contains('active');

      if (isActive) {
        mainMenu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      } else {
        mainMenu.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (
        mainMenu.classList.contains('active') &&
        !menuToggle.contains(event.target) &&
        !mainMenu.contains(event.target)
      ) {
        mainMenu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMenu);
  } else {
    initializeMenu();
  }
})();
