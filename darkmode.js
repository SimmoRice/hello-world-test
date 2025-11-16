/**
 * Dark Mode Toggle - Secure Implementation
 *
 * Security features:
 * - Input validation for localStorage values
 * - XSS protection through allowlist validation
 * - No inline event handlers (CSP compliant)
 * - Sanitized data attribute values
 */

'use strict';

// Security: Define allowed theme values (allowlist approach)
const ALLOWED_THEMES = ['light', 'dark'];
const DEFAULT_THEME = 'light';

/**
 * Validates and sanitizes theme value
 * Security: Prevents XSS by only allowing predefined theme values
 *
 * @param {string} theme - The theme value to validate
 * @returns {string} - A valid theme value from the allowlist
 */
function validateTheme(theme) {
    // Security: Strict type checking
    if (typeof theme !== 'string') {
        console.warn('Security: Invalid theme type detected, using default');
        return DEFAULT_THEME;
    }

    // Security: Normalize and validate against allowlist
    const normalizedTheme = theme.trim().toLowerCase();

    if (!ALLOWED_THEMES.includes(normalizedTheme)) {
        console.warn('Security: Invalid theme value detected, using default');
        return DEFAULT_THEME;
    }

    return normalizedTheme;
}

/**
 * Safely reads theme preference from localStorage
 * Security: Validates input to prevent XSS attacks via localStorage manipulation
 *
 * @returns {string} - A validated theme value
 */
function getSavedTheme() {
    try {
        // Security: Wrap localStorage access in try-catch to handle quota/access errors
        const savedTheme = localStorage.getItem('theme');

        // Security: Validate the retrieved value
        return validateTheme(savedTheme || DEFAULT_THEME);
    } catch (error) {
        // Security: Handle localStorage errors gracefully (e.g., private browsing, quota exceeded)
        console.warn('Security: localStorage access error, using default theme', error);
        return DEFAULT_THEME;
    }
}

/**
 * Safely saves theme preference to localStorage
 * Security: Only allows validated theme values to be stored
 *
 * @param {string} theme - The theme to save
 */
function saveTheme(theme) {
    try {
        // Security: Validate before saving
        const validatedTheme = validateTheme(theme);
        localStorage.setItem('theme', validatedTheme);
    } catch (error) {
        // Security: Handle localStorage errors gracefully
        console.warn('Security: localStorage save error', error);
    }
}

/**
 * Applies theme to the document
 * Security: Uses data attribute with validated values only
 *
 * @param {string} theme - The theme to apply
 */
function applyTheme(theme) {
    // Security: Validate theme before applying to DOM
    const validatedTheme = validateTheme(theme);

    // Security: Use setAttribute with validated value to prevent attribute injection
    document.documentElement.setAttribute('data-theme', validatedTheme);

    // Update checkbox state to match theme
    const checkbox = document.getElementById('darkModeToggle');
    if (checkbox) {
        checkbox.checked = (validatedTheme === 'dark');
    }
}

/**
 * Initialize dark mode from localStorage on page load
 * Security: Prevents flash of unstyled content (FOUC) while maintaining security
 */
function initializeDarkMode() {
    // Security: Get and validate saved theme
    const savedTheme = getSavedTheme();

    // Apply validated theme
    applyTheme(savedTheme);
}

/**
 * Toggle between light and dark mode
 * Security: Uses validated values and safe DOM manipulation
 */
function toggleDarkMode() {
    // Security: Get current theme and validate
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const validatedCurrent = validateTheme(currentTheme || DEFAULT_THEME);

    // Toggle to opposite theme
    const newTheme = validatedCurrent === 'dark' ? 'light' : 'dark';

    // Apply and save the new theme
    applyTheme(newTheme);
    saveTheme(newTheme);
}

/**
 * Setup event listeners when DOM is ready
 * Security: Uses addEventListener instead of inline handlers for CSP compliance
 */
function setupEventListeners() {
    // Get toggle container
    const toggleContainer = document.querySelector('.dark-mode-toggle');
    const checkbox = document.getElementById('darkModeToggle');

    if (!toggleContainer || !checkbox) {
        console.error('Security: Required DOM elements not found');
        return;
    }

    // Security: Event listeners attached programmatically (CSP compliant)
    toggleContainer.addEventListener('click', function(event) {
        // Prevent double-triggering when clicking checkbox directly
        if (event.target !== checkbox) {
            toggleDarkMode();
        }
    });

    // Handle checkbox changes
    checkbox.addEventListener('change', function() {
        toggleDarkMode();
    });

    // Keyboard accessibility
    toggleContainer.addEventListener('keydown', function(event) {
        // Security: Validate key values
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleDarkMode();
        }
    });
}

// Security: Initialize when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeDarkMode();
        setupEventListeners();
    });
} else {
    // DOM already loaded
    initializeDarkMode();
    setupEventListeners();
}

// Export functions for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateTheme,
        getSavedTheme,
        saveTheme,
        applyTheme,
        initializeDarkMode,
        toggleDarkMode,
        setupEventListeners,
        ALLOWED_THEMES,
        DEFAULT_THEME
    };
    // Make functions available globally for tests
    global.validateTheme = validateTheme;
    global.getSavedTheme = getSavedTheme;
    global.saveTheme = saveTheme;
    global.applyTheme = applyTheme;
    global.initializeDarkMode = initializeDarkMode;
    global.toggleDarkMode = toggleDarkMode;
    global.setupEventListeners = setupEventListeners;
}
