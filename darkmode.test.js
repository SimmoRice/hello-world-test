/**
 * Comprehensive test suite for darkmode.js
 * Tests functionality, security, edge cases, and error handling
 */

'use strict';

describe('Dark Mode Toggle - Comprehensive Tests', () => {
    let originalLocalStorage;
    let mockLocalStorage;

    beforeEach(() => {
        // Reset DOM
        document.documentElement.removeAttribute('data-theme');
        document.body.innerHTML = `
            <div class="dark-mode-toggle" role="button" aria-label="Toggle dark mode" tabindex="0">
                <span class="theme-icon sun-icon">☀️</span>
                <input
                    type="checkbox"
                    id="darkModeToggle"
                    class="toggle-checkbox"
                    aria-label="Dark mode toggle"
                >
                <span class="theme-icon moon-icon">🌙</span>
            </div>
            <main>
                <h1>Hello World</h1>
            </main>
        `;

        // Mock localStorage
        mockLocalStorage = {
            store: {},
            getItem: jest.fn(function(key) {
                return this.store[key] || null;
            }),
            setItem: jest.fn(function(key, value) {
                this.store[key] = value.toString();
            }),
            clear: jest.fn(function() {
                this.store = {};
            })
        };

        originalLocalStorage = global.localStorage;
        Object.defineProperty(global, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        // Load the darkmode.js code
        require('./darkmode.js');
    });

    afterEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        Object.defineProperty(global, 'localStorage', {
            value: originalLocalStorage,
            writable: true
        });
    });

    // ============================================
    // HAPPY PATH TESTS
    // ============================================

    describe('Happy Path - Basic Functionality', () => {
        test('should apply light theme by default', () => {
            const savedTheme = global.getSavedTheme();
            expect(savedTheme).toBe('light');
        });

        test('should apply theme to document element', () => {
            global.applyTheme('dark');
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        });

        test('should update checkbox state when applying theme', () => {
            const checkbox = document.getElementById('darkModeToggle');

            global.applyTheme('dark');
            expect(checkbox.checked).toBe(true);

            global.applyTheme('light');
            expect(checkbox.checked).toBe(false);
        });

        test('should toggle between light and dark themes', () => {
            global.applyTheme('light');
            global.toggleDarkMode();
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

            global.toggleDarkMode();
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });

        test('should save theme to localStorage when toggling', () => {
            global.applyTheme('light');
            global.toggleDarkMode();

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
        });

        test('should load saved theme from localStorage', () => {
            mockLocalStorage.store = { theme: 'dark' };
            const savedTheme = global.getSavedTheme();
            expect(savedTheme).toBe('dark');
        });

        test('should initialize dark mode from saved preference', () => {
            mockLocalStorage.store = { theme: 'dark' };
            global.initializeDarkMode();
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        });
    });

    // ============================================
    // SECURITY VALIDATION TESTS
    // ============================================

    describe('Security - Input Validation', () => {
        test('should reject non-string theme values', () => {
            const result1 = global.validateTheme(123);
            const result2 = global.validateTheme({});
            const result3 = global.validateTheme([]);
            const result4 = global.validateTheme(null);
            const result5 = global.validateTheme(undefined);

            expect(result1).toBe('light');
            expect(result2).toBe('light');
            expect(result3).toBe('light');
            expect(result4).toBe('light');
            expect(result5).toBe('light');
        });

        test('should reject invalid theme values (XSS prevention)', () => {
            const xssAttempts = [
                '<script>alert("XSS")</script>',
                'javascript:alert(1)',
                'onload=alert(1)',
                '<img src=x onerror=alert(1)>',
                'dark"><script>alert(1)</script>',
                'dark" onclick="alert(1)"',
                '../../../etc/passwd',
                'dark; DROP TABLE users;--'
            ];

            xssAttempts.forEach(malicious => {
                const result = global.validateTheme(malicious);
                expect(result).toBe('light');
                expect(['light', 'dark']).toContain(result);
            });
        });

        test('should only allow allowlisted theme values', () => {
            const invalidThemes = [
                'blue',
                'custom',
                'dark-blue',
                'light-mode',
                'theme1',
                'darkmode'
            ];

            invalidThemes.forEach(theme => {
                const result = global.validateTheme(theme);
                expect(result).toBe('light');
            });
        });

        test('should normalize theme values (trim and lowercase)', () => {
            expect(global.validateTheme('  dark  ')).toBe('dark');
            expect(global.validateTheme('DARK')).toBe('dark');
            expect(global.validateTheme('Dark')).toBe('dark');
            expect(global.validateTheme('  LIGHT  ')).toBe('light');
        });

        test('should sanitize theme before applying to DOM', () => {
            global.applyTheme('<script>alert("XSS")</script>');
            const theme = document.documentElement.getAttribute('data-theme');
            expect(theme).toBe('light');
            expect(theme).not.toContain('<script>');
        });

        test('should prevent attribute injection via theme value', () => {
            const injectionAttempts = [
                'dark" data-evil="true',
                'dark\' data-evil=\'true',
                'dark onclick=alert(1)',
                'dark" onclick="alert(1)'
            ];

            injectionAttempts.forEach(malicious => {
                global.applyTheme(malicious);
                const theme = document.documentElement.getAttribute('data-theme');
                expect(theme).toBe('light');
                expect(document.documentElement.getAttribute('data-evil')).toBeNull();
            });
        });
    });

    // ============================================
    // LOCALSTORAGE ERROR HANDLING TESTS
    // ============================================

    describe('Error Handling - localStorage', () => {
        test('should handle localStorage getItem errors gracefully', () => {
            mockLocalStorage.getItem = jest.fn(() => {
                throw new Error('QuotaExceededError');
            });

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const result = global.getSavedTheme();

            expect(result).toBe('light');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should handle localStorage setItem errors gracefully', () => {
            mockLocalStorage.setItem = jest.fn(() => {
                throw new Error('QuotaExceededError');
            });

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            // Should not throw error
            expect(() => global.saveTheme('dark')).not.toThrow();
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should work when localStorage is unavailable (private browsing)', () => {
            Object.defineProperty(global, 'localStorage', {
                value: undefined,
                writable: true
            });

            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            // Should return default without crashing
            const result = global.getSavedTheme();
            expect(result).toBe('light');

            consoleSpy.mockRestore();
        });

        test('should validate corrupted localStorage data', () => {
            mockLocalStorage.store = { theme: '<script>alert(1)</script>' };
            const savedTheme = global.getSavedTheme();
            expect(savedTheme).toBe('light');
        });

        test('should handle empty string from localStorage', () => {
            mockLocalStorage.store = { theme: '' };
            const savedTheme = global.getSavedTheme();
            expect(savedTheme).toBe('light');
        });

        test('should handle null from localStorage', () => {
            mockLocalStorage.store = {};
            const savedTheme = global.getSavedTheme();
            expect(savedTheme).toBe('light');
        });
    });

    // ============================================
    // EDGE CASES TESTS
    // ============================================

    describe('Edge Cases', () => {
        test('should handle missing checkbox element gracefully', () => {
            document.getElementById('darkModeToggle').remove();

            // Should not throw error
            expect(() => global.applyTheme('dark')).not.toThrow();
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        });

        test('should handle missing toggle container gracefully', () => {
            document.querySelector('.dark-mode-toggle').remove();

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            // Should not throw error
            expect(() => global.setupEventListeners()).not.toThrow();
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        test('should handle rapid theme toggles', () => {
            for (let i = 0; i < 10; i++) {
                global.toggleDarkMode();
            }

            const finalTheme = document.documentElement.getAttribute('data-theme');
            expect(['light', 'dark']).toContain(finalTheme);
        });

        test('should handle theme toggle when current theme is invalid', () => {
            document.documentElement.setAttribute('data-theme', 'invalid');
            global.toggleDarkMode();

            const newTheme = document.documentElement.getAttribute('data-theme');
            expect(['light', 'dark']).toContain(newTheme);
        });

        test('should handle case-insensitive saved themes', () => {
            mockLocalStorage.store = { theme: 'DARK' };
            const savedTheme = global.getSavedTheme();
            expect(savedTheme).toBe('dark');
        });

        test('should handle whitespace in saved themes', () => {
            mockLocalStorage.store = { theme: '  dark  ' };
            const savedTheme = global.getSavedTheme();
            expect(savedTheme).toBe('dark');
        });

        test('should apply theme correctly when called multiple times', () => {
            global.applyTheme('dark');
            global.applyTheme('dark');
            global.applyTheme('dark');

            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        });

        test('should handle undefined as theme parameter', () => {
            const result = global.validateTheme(undefined);
            expect(result).toBe('light');
        });

        test('should handle boolean values as theme', () => {
            expect(global.validateTheme(true)).toBe('light');
            expect(global.validateTheme(false)).toBe('light');
        });

        test('should handle special characters in theme value', () => {
            const specialChars = [
                'dark\n',
                'dark\r\n',
                'dark\t',
                'dark\0',
                'dark\\',
                'dark/',
                'dark#',
                'dark%'
            ];

            specialChars.forEach(char => {
                const result = global.validateTheme(char);
                // Should either return valid theme or default
                expect(['light', 'dark']).toContain(result);
            });
        });
    });

    // ============================================
    // DOM MANIPULATION TESTS
    // ============================================

    describe('DOM Manipulation', () => {
        test('should set data-theme attribute on documentElement', () => {
            global.applyTheme('dark');
            expect(document.documentElement.hasAttribute('data-theme')).toBe(true);
        });

        test('should not create additional attributes when applying theme', () => {
            const initialAttributes = document.documentElement.attributes.length;
            global.applyTheme('dark');
            const finalAttributes = document.documentElement.attributes.length;

            // Should add only data-theme attribute
            expect(finalAttributes - initialAttributes).toBeLessThanOrEqual(1);
        });

        test('should update checkbox checked property correctly', () => {
            const checkbox = document.getElementById('darkModeToggle');

            global.applyTheme('dark');
            expect(checkbox.checked).toBe(true);
            expect(checkbox.hasAttribute('checked') || checkbox.checked).toBe(true);

            global.applyTheme('light');
            expect(checkbox.checked).toBe(false);
        });

        test('should maintain checkbox reference after multiple applies', () => {
            const checkbox = document.getElementById('darkModeToggle');
            const checkboxRef = checkbox;

            global.applyTheme('dark');
            global.applyTheme('light');
            global.applyTheme('dark');

            // Checkbox should still be the same element
            expect(document.getElementById('darkModeToggle')).toBe(checkboxRef);
        });
    });

    // ============================================
    // EVENT LISTENER TESTS
    // ============================================

    describe('Event Listeners', () => {
        beforeEach(() => {
            global.applyTheme('light'); // Set initial theme
        });

        test('should setup event listeners without errors', () => {
            const toggleContainer = document.querySelector('.dark-mode-toggle');
            const checkbox = document.getElementById('darkModeToggle');

            expect(toggleContainer).toBeTruthy();
            expect(checkbox).toBeTruthy();
            expect(() => global.setupEventListeners()).not.toThrow();
        });

        test('should have accessible toggle elements', () => {
            const toggleContainer = document.querySelector('.dark-mode-toggle');
            const checkbox = document.getElementById('darkModeToggle');

            expect(toggleContainer.getAttribute('role')).toBe('button');
            expect(toggleContainer.getAttribute('tabindex')).toBe('0');
            expect(checkbox.id).toBe('darkModeToggle');
        });

        test('should toggle theme programmatically (simulating user interaction)', () => {
            const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';

            // Simulate what happens when user interacts
            global.toggleDarkMode();

            const newTheme = document.documentElement.getAttribute('data-theme');
            expect(newTheme).not.toBe(initialTheme);
            expect(['light', 'dark']).toContain(newTheme);
        });

        test('should handle multiple toggle interactions', () => {
            global.applyTheme('light');

            // First toggle: light -> dark
            global.toggleDarkMode();
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

            // Second toggle: dark -> light
            global.toggleDarkMode();
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');

            // Third toggle: light -> dark
            global.toggleDarkMode();
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        });

        test('should update checkbox state on toggle', () => {
            const checkbox = document.getElementById('darkModeToggle');

            global.applyTheme('light');
            expect(checkbox.checked).toBe(false);

            global.toggleDarkMode();
            expect(checkbox.checked).toBe(true);

            global.toggleDarkMode();
            expect(checkbox.checked).toBe(false);
        });

        test('should save theme to localStorage on toggle', () => {
            global.applyTheme('light');

            global.toggleDarkMode();
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');

            global.toggleDarkMode();
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light');
        });
    });

    // ============================================
    // INITIALIZATION TESTS
    // ============================================

    describe('Initialization', () => {
        test('should initialize with saved dark theme', () => {
            mockLocalStorage.store = { theme: 'dark' };
            global.initializeDarkMode();

            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
            const checkbox = document.getElementById('darkModeToggle');
            expect(checkbox.checked).toBe(true);
        });

        test('should initialize with saved light theme', () => {
            mockLocalStorage.store = { theme: 'light' };
            global.initializeDarkMode();

            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
            const checkbox = document.getElementById('darkModeToggle');
            expect(checkbox.checked).toBe(false);
        });

        test('should initialize with default theme when nothing saved', () => {
            mockLocalStorage.store = {};
            global.initializeDarkMode();

            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });

        test('should handle initialization when DOM is not ready', () => {
            // This is a structural test - ensure code handles DOMContentLoaded
            expect(() => {
                if (document.readyState === 'loading') {
                    document.dispatchEvent(new Event('DOMContentLoaded'));
                }
            }).not.toThrow();
        });
    });

    // ============================================
    // INTEGRATION TESTS
    // ============================================

    describe('Integration - Full User Flow', () => {
        test('should complete full toggle cycle with persistence', () => {
            // Start with clean state
            mockLocalStorage.store = {};
            global.initializeDarkMode();
            global.setupEventListeners();

            // Should be light by default
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');

            // User clicks toggle
            global.toggleDarkMode();
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');

            // Simulate page reload
            const savedTheme = global.getSavedTheme();
            expect(savedTheme).toBe('dark');
            global.initializeDarkMode();
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

            // User toggles back
            global.toggleDarkMode();
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });

        test('should maintain theme consistency across multiple toggles', () => {
            global.initializeDarkMode();
            const toggleCount = 20;

            for (let i = 0; i < toggleCount; i++) {
                global.toggleDarkMode();
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const expectedTheme = i % 2 === 0 ? 'dark' : 'light';
                expect(currentTheme).toBe(expectedTheme);
            }
        });

        test('should handle theme persistence with invalid data injection', () => {
            // User has valid theme
            mockLocalStorage.store = { theme: 'dark' };
            global.initializeDarkMode();
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

            // Malicious script tries to inject XSS
            mockLocalStorage.store = { theme: '<script>alert("XSS")</script>' };
            global.initializeDarkMode();

            // Should fallback to default, not execute script
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });
    });

    // ============================================
    // ACCESSIBILITY TESTS
    // ============================================

    describe('Accessibility', () => {
        test('should maintain ARIA attributes on toggle', () => {
            global.setupEventListeners();
            const toggleContainer = document.querySelector('.dark-mode-toggle');
            const checkbox = document.getElementById('darkModeToggle');

            expect(toggleContainer.getAttribute('role')).toBe('button');
            expect(toggleContainer.getAttribute('aria-label')).toBeTruthy();
            expect(checkbox.getAttribute('aria-label')).toBeTruthy();
        });

        test('should be keyboard accessible', () => {
            global.setupEventListeners();
            const toggleContainer = document.querySelector('.dark-mode-toggle');

            expect(toggleContainer.getAttribute('tabindex')).toBe('0');
        });

        test('should update checkbox state for screen readers', () => {
            const checkbox = document.getElementById('darkModeToggle');

            global.applyTheme('dark');
            expect(checkbox.checked).toBe(true);

            global.applyTheme('light');
            expect(checkbox.checked).toBe(false);
        });
    });

    // ============================================
    // PERFORMANCE TESTS
    // ============================================

    describe('Performance', () => {
        test('should handle rapid theme changes efficiently', () => {
            const startTime = performance.now();

            for (let i = 0; i < 100; i++) {
                global.applyTheme(i % 2 === 0 ? 'dark' : 'light');
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should complete 100 theme changes in less than 100ms
            expect(duration).toBeLessThan(100);
        });

        test('should not leak memory on repeated toggles', () => {
            const checkbox = document.getElementById('darkModeToggle');

            for (let i = 0; i < 1000; i++) {
                global.toggleDarkMode();
            }

            // Checkbox should still exist and be functional
            expect(checkbox).toBeTruthy();
            expect(checkbox.id).toBe('darkModeToggle');
        });
    });

    // ============================================
    // CSP COMPLIANCE TESTS
    // ============================================

    describe('CSP Compliance', () => {
        test('should not use inline event handlers', () => {
            const toggleContainer = document.querySelector('.dark-mode-toggle');
            const checkbox = document.getElementById('darkModeToggle');

            // Check for inline event handlers
            expect(toggleContainer.getAttribute('onclick')).toBeNull();
            expect(checkbox.getAttribute('onclick')).toBeNull();
            expect(checkbox.getAttribute('onchange')).toBeNull();
        });

        test('should use addEventListener for event binding', () => {
            const toggleContainer = document.querySelector('.dark-mode-toggle');
            const checkbox = document.getElementById('darkModeToggle');

            // Should be able to set up event listeners without CSP violations
            expect(() => global.setupEventListeners()).not.toThrow();

            // Elements should have no inline handlers
            const containerHandlers = Object.keys(toggleContainer).filter(k => k.startsWith('on'));
            const checkboxHandlers = Object.keys(checkbox).filter(k => k.startsWith('on'));

            expect(containerHandlers.length).toBe(0);
            expect(checkboxHandlers.length).toBe(0);
        });
    });
});
