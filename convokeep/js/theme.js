/**
 * Theme Toggler - Simple theme management
 * 
 * This replaces the original simpleTheme.js with a more streamlined implementation
 */

// Initialize theme on load
document.addEventListener('DOMContentLoaded', initTheme);

function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', (e) => {
      toggleTheme();
      
      // Prevent event bubbling to avoid conflicts
      e.stopPropagation();
    });
  }
  
  // Update code theme and theme icon
  updateCodeTheme();
  updateThemeIcon();
}

function updateThemeIcon() {
  const themeIcon = document.getElementById('theme-icon');
  const themeLabel = document.getElementById('theme-label');
  
  if (themeIcon || themeLabel) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    
    // Update icon - Moon for light mode (to switch to dark), Sun for dark mode (to switch to light)
    if (themeIcon) {
      themeIcon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    }
    
    // Update label - opposite of current theme
    if (themeLabel) {
      themeLabel.textContent = currentTheme === 'light' ? 'Dark' : 'Light';
    }
  }
}

function toggleTheme() {
  // Get current theme
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  
  // Toggle theme
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  // Apply theme
  document.documentElement.setAttribute('data-theme', newTheme);
  
  // Save theme preference
  localStorage.setItem('theme', newTheme);
  localStorage.setItem('theme-user-selected', 'true');
  
  // Update code theme and theme icon
  updateCodeTheme();
  updateThemeIcon();
}

function updateCodeTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const themeLink = document.getElementById('hljs-theme');

  if (themeLink) {
    themeLink.href = isDark
      ? 'lib/catppuccin/catppuccin-mocha.css'
      : 'lib/catppuccin/catppuccin-latte.css';
  }
}
