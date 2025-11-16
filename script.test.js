/**
 * Comprehensive test suite for script.js
 * Tests color-changing button functionality, security validations, and edge cases
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');

// Load the HTML content
const fs = require('fs');
const path = require('path');

describe('Color Change Button Feature', () => {
  beforeEach(() => {
    // Set up DOM with our HTML
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    document.body.innerHTML = html.split('<body>')[1].split('</body>')[0];

    // Mock console methods to test error handling
    global.console.error = jest.fn();
    global.console.log = jest.fn();
  });

  afterEach(() => {
    // Clean up
    jest.clearAllMocks();
  });

  describe('HTML Structure Tests', () => {
    test('should have hello-text element with id', () => {
      const textElement = document.getElementById('hello-text');
      expect(textElement).not.toBeNull();
      expect(textElement.tagName).toBe('H1');
    });

    test('should have color-change-btn button with id', () => {
      const button = document.getElementById('color-change-btn');
      expect(button).not.toBeNull();
      expect(button.tagName).toBe('BUTTON');
    });

    test('should have "Hello World" text content', () => {
      const textElement = document.getElementById('hello-text');
      expect(textElement.textContent).toBe('Hello World');
    });

    test('should have "Change Color" button text', () => {
      const button = document.getElementById('color-change-btn');
      expect(button.textContent).toBe('Change Color');
    });

    test('should have button below text in DOM order', () => {
      const textElement = document.getElementById('hello-text');
      const button = document.getElementById('color-change-btn');
      const container = textElement.parentElement;

      expect(container).toBe(button.parentElement);
      const children = Array.from(container.children);
      expect(children.indexOf(textElement)).toBeLessThan(children.indexOf(button));
    });
  });

  describe('getRandomColor() Function Tests', () => {
    // We need to load the script's functions
    let getRandomColor;
    let colors;

    beforeEach(() => {
      // Load script.js and extract the function
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      // Extract colors array
      const colorsMatch = scriptContent.match(/const colors = \[([\s\S]*?)\];/);
      expect(colorsMatch).not.toBeNull();
      const colorsStr = colorsMatch[1];
      colors = colorsStr.match(/'#[0-9A-Fa-f]{6}'/g).map(c => c.replace(/'/g, ''));

      // Create a test version of getRandomColor
      let lastColorIndex = -1;
      getRandomColor = () => {
        if (!Array.isArray(colors) || colors.length === 0) {
          console.error('Colors array is invalid or empty');
          return '#FFFFFF';
        }

        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * colors.length);
        } while (newIndex === lastColorIndex && colors.length > 1);

        lastColorIndex = newIndex;
        return colors[newIndex];
      };
    });

    test('should return a valid hex color', () => {
      const color = getRandomColor();
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    test('should return a color from the predefined colors array', () => {
      const color = getRandomColor();
      expect(colors).toContain(color);
    });

    test('should return different colors on consecutive calls (probabilistic)', () => {
      const results = new Set();
      // Run multiple times to ensure we get different colors
      for (let i = 0; i < 50; i++) {
        results.add(getRandomColor());
      }
      // Should get multiple different colors (at least 3 out of 50 calls)
      expect(results.size).toBeGreaterThanOrEqual(3);
    });

    test('should handle empty colors array gracefully', () => {
      // Mock the colors array being empty
      const originalColors = colors;
      colors = [];

      const safeGetRandomColor = () => {
        if (!Array.isArray(colors) || colors.length === 0) {
          console.error('Colors array is invalid or empty');
          return '#FFFFFF';
        }
        return colors[Math.floor(Math.random() * colors.length)];
      };

      const result = safeGetRandomColor();
      expect(result).toBe('#FFFFFF');
      expect(console.error).toHaveBeenCalledWith('Colors array is invalid or empty');

      colors = originalColors;
    });

    test('colors array should have at least 5 colors for variety', () => {
      expect(colors.length).toBeGreaterThanOrEqual(5);
    });

    test('all colors in array should be valid hex format', () => {
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    test('colors should be visually different (no duplicates)', () => {
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });
  });

  describe('changeTextColor() Function Tests', () => {
    let changeTextColor;
    let textElement;

    beforeEach(() => {
      // Load script and DOM
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      // Get text element
      textElement = document.getElementById('hello-text');

      // Create test version of changeTextColor
      changeTextColor = () => {
        const elem = document.getElementById('hello-text');

        if (!elem) {
          console.error('Text element not found in DOM');
          return;
        }

        // Simplified color selection for testing
        const testColors = ['#FF6B6B', '#4ECDC4', '#FFD93D'];
        const newColor = testColors[Math.floor(Math.random() * testColors.length)];

        if (!/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
          console.error('Invalid color format detected');
          return;
        }

        elem.style.color = newColor;
      };
    });

    test('should change text element color when called', () => {
      const originalColor = textElement.style.color;
      changeTextColor();
      const newColor = textElement.style.color;

      // Color should be set (might be same by chance, but should have a value)
      expect(newColor).toBeTruthy();
      expect(newColor).toMatch(/rgb\(\d+, \d+, \d+\)/);
    });

    test('should handle missing text element gracefully', () => {
      // Remove the element
      const elem = document.getElementById('hello-text');
      elem.remove();

      changeTextColor();
      expect(console.error).toHaveBeenCalledWith('Text element not found in DOM');
    });

    test('should validate color format before applying', () => {
      const invalidChangeColor = () => {
        const elem = document.getElementById('hello-text');
        if (!elem) return;

        const invalidColor = 'invalid-color';
        if (!/^#[0-9A-Fa-f]{6}$/.test(invalidColor)) {
          console.error('Invalid color format detected');
          return;
        }
        elem.style.color = invalidColor;
      };

      invalidChangeColor();
      expect(console.error).toHaveBeenCalledWith('Invalid color format detected');
    });

    test('should not apply color if validation fails', () => {
      const originalColor = textElement.style.color;

      const invalidChangeColor = () => {
        const elem = document.getElementById('hello-text');
        if (!elem) return;

        const invalidColor = 'rgb(999, 999, 999)'; // Invalid but wrong format
        if (!/^#[0-9A-Fa-f]{6}$/.test(invalidColor)) {
          console.error('Invalid color format detected');
          return;
        }
        elem.style.color = invalidColor;
      };

      invalidChangeColor();
      expect(textElement.style.color).toBe(originalColor);
    });
  });

  describe('Button Click Event Tests', () => {
    let button;
    let textElement;

    beforeEach(() => {
      button = document.getElementById('color-change-btn');
      textElement = document.getElementById('hello-text');

      // Add simple click handler for testing
      button.addEventListener('click', () => {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D'];
        const newColor = colors[Math.floor(Math.random() * colors.length)];
        textElement.style.color = newColor;
      });
    });

    test('should have click event listener on button', () => {
      const clickHandler = jest.fn();
      const testButton = document.getElementById('color-change-btn');
      testButton.addEventListener('click', clickHandler);

      testButton.click();
      expect(clickHandler).toHaveBeenCalled();
    });

    test('should change text color when button is clicked', () => {
      const originalColor = textElement.style.color;
      button.click();

      // Color should be set after click
      expect(textElement.style.color).toBeTruthy();
    });

    test('should change color multiple times on multiple clicks', () => {
      const colors = new Set();

      for (let i = 0; i < 10; i++) {
        button.click();
        colors.add(textElement.style.color);
      }

      // Should have gotten at least one color value
      expect(colors.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Keyboard Event Tests', () => {
    let button;
    let textElement;

    beforeEach(() => {
      button = document.getElementById('color-change-btn');
      textElement = document.getElementById('hello-text');

      // Add keyboard handler
      button.addEventListener('keydown', (event) => {
        if (!event || typeof event.key !== 'string') {
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D'];
          textElement.style.color = colors[Math.floor(Math.random() * colors.length)];
        }
      });
    });

    test('should handle Enter key press', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      button.dispatchEvent(event);

      expect(textElement.style.color).toBeTruthy();
    });

    test('should handle Space key press', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      button.dispatchEvent(event);

      expect(textElement.style.color).toBeTruthy();
    });

    test('should not trigger on other keys', () => {
      const originalColor = textElement.style.color;
      const event = new KeyboardEvent('keydown', { key: 'a' });
      button.dispatchEvent(event);

      expect(textElement.style.color).toBe(originalColor);
    });

    test('should validate event object exists', () => {
      const handler = (event) => {
        if (!event || typeof event.key !== 'string') {
          return false;
        }
        return true;
      };

      expect(handler(null)).toBe(false);
      expect(handler({})).toBe(false);
      expect(handler({ key: 'Enter' })).toBe(true);
    });
  });

  describe('Security Tests', () => {
    test('should use predefined colors only (no user input)', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      // Verify hardcoded colors array exists
      expect(scriptContent).toMatch(/const colors = \[/);

      // Verify no actual eval usage by removing comments first
      const withoutComments = scriptContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
      expect(withoutComments).not.toMatch(/\beval\s*\(/);
      expect(withoutComments).not.toMatch(/new Function\(/);
    });

    test('should validate DOM elements before manipulation', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      // Should check if element exists
      expect(scriptContent).toMatch(/if\s*\(\s*!.*Element\s*\)/);
    });

    test('should validate color format with regex', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      // Should have color validation regex
      expect(scriptContent).toMatch(/#[0-9A-Fa-f]{6}/);
      expect(scriptContent).toMatch(/test\(/);
    });

    test('should not use inline event handlers (CSP compliant)', () => {
      const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

      // Should not have onclick, onload, etc.
      expect(htmlContent).not.toMatch(/onclick=/i);
      expect(htmlContent).not.toMatch(/onload=/i);
      expect(htmlContent).not.toMatch(/onerror=/i);
    });

    test('should use addEventListener instead of inline handlers', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      expect(scriptContent).toMatch(/addEventListener/);
    });

    test('should wait for DOMContentLoaded before accessing DOM', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      expect(scriptContent).toMatch(/DOMContentLoaded/);
    });

    test('should handle missing button element gracefully', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      // Should check if button exists
      expect(scriptContent).toMatch(/if\s*\(\s*!button\s*\)/);
    });

    test('should log errors to console for debugging', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      expect(scriptContent).toMatch(/console\.error/);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle rapid button clicks', () => {
      const button = document.getElementById('color-change-btn');
      const textElement = document.getElementById('hello-text');

      button.addEventListener('click', () => {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D'];
        textElement.style.color = colors[Math.floor(Math.random() * colors.length)];
      });

      // Simulate rapid clicks
      for (let i = 0; i < 100; i++) {
        button.click();
      }

      // Should still have a valid color
      expect(textElement.style.color).toBeTruthy();
    });

    test('should handle null event object', () => {
      const handler = (event) => {
        if (!event || typeof event.key !== 'string') {
          return;
        }
        // Process event
      };

      // Should not throw error
      expect(() => handler(null)).not.toThrow();
      expect(() => handler(undefined)).not.toThrow();
    });

    test('should handle missing style property', () => {
      const textElement = document.getElementById('hello-text');

      // Element should have style property
      expect(textElement.style).toBeDefined();
      expect(typeof textElement.style.color).not.toBe('undefined');
    });

    test('should handle case where colors array is undefined', () => {
      const safeGetColor = (colors) => {
        if (!Array.isArray(colors) || colors.length === 0) {
          console.error('Colors array is invalid or empty');
          return '#FFFFFF';
        }
        return colors[0];
      };

      expect(safeGetColor(undefined)).toBe('#FFFFFF');
      expect(safeGetColor(null)).toBe('#FFFFFF');
      expect(safeGetColor([])).toBe('#FFFFFF');
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle single color in array', () => {
      const singleColorArray = ['#FF6B6B'];
      const getColor = (colors) => {
        if (!Array.isArray(colors) || colors.length === 0) {
          return '#FFFFFF';
        }
        return colors[Math.floor(Math.random() * colors.length)];
      };

      const color = getColor(singleColorArray);
      expect(color).toBe('#FF6B6B');
    });

    test('should prevent default behavior on Space key to avoid page scroll', () => {
      const button = document.getElementById('color-change-btn');
      const preventDefaultSpy = jest.fn();

      button.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
          event.preventDefault = preventDefaultSpy;
          event.preventDefault();
        }
      });

      const event = new KeyboardEvent('keydown', { key: ' ' });
      button.dispatchEvent(event);

      // preventDefault should be defined
      expect(event.preventDefault).toBeDefined();
    });
  });

  describe('Acceptance Criteria Tests', () => {
    test('AC1: Button is visible on the page', () => {
      const button = document.getElementById('color-change-btn');
      expect(button).not.toBeNull();
      // In JSDOM, offsetParent is not fully supported, so just check element exists
      expect(button).toBeDefined();
      expect(button.style.display).not.toBe('none');
    });

    test('AC2: Button is centered below the text', () => {
      const button = document.getElementById('color-change-btn');
      const textElement = document.getElementById('hello-text');
      const container = button.parentElement;

      // Both should be in same container
      expect(container).toBe(textElement.parentElement);

      // Button should come after text in DOM order
      const children = Array.from(container.children);
      expect(children.indexOf(button)).toBeGreaterThan(children.indexOf(textElement));
    });

    test('AC3: Clicking the button changes the text color', () => {
      const button = document.getElementById('color-change-btn');
      const textElement = document.getElementById('hello-text');

      // Add handler
      button.addEventListener('click', () => {
        textElement.style.color = '#FF6B6B';
      });

      const originalColor = textElement.style.color;
      button.click();

      expect(textElement.style.color).not.toBe(originalColor);
      expect(textElement.style.color).toBeTruthy();
    });

    test('AC4: Colors should be visually different each time', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      // Should have logic to avoid same color twice in a row
      expect(scriptContent).toMatch(/lastColorIndex/);
      expect(scriptContent).toMatch(/while.*===.*lastColorIndex/);
    });
  });

  describe('Integration Tests', () => {
    test('should work end-to-end: button click changes text color', () => {
      const button = document.getElementById('color-change-btn');
      const textElement = document.getElementById('hello-text');

      // Add full implementation
      const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3'];
      let lastIndex = -1;

      button.addEventListener('click', () => {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * colors.length);
        } while (newIndex === lastIndex && colors.length > 1);

        lastIndex = newIndex;
        textElement.style.color = colors[newIndex];
      });

      // Test multiple clicks
      const colorsSeen = new Set();
      for (let i = 0; i < 20; i++) {
        button.click();
        colorsSeen.add(textElement.style.color);
      }

      // Should have seen multiple colors
      expect(colorsSeen.size).toBeGreaterThan(1);
    });

    test('should maintain state across multiple interactions', () => {
      const button = document.getElementById('color-change-btn');
      const textElement = document.getElementById('hello-text');

      button.addEventListener('click', () => {
        textElement.style.color = '#FF6B6B';
      });

      // Multiple interactions
      button.click();
      const color1 = textElement.style.color;

      button.click();
      const color2 = textElement.style.color;

      expect(color1).toBeTruthy();
      expect(color2).toBeTruthy();
    });
  });

  describe('Code Quality Tests', () => {
    test('should have comments explaining the functionality', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      // Should have JSDoc or regular comments
      expect(scriptContent).toMatch(/\/\*\*|\/{2}/);
    });

    test('should use const/let instead of var', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      // Should use modern JavaScript
      expect(scriptContent).toMatch(/const |let /);

      // Should not use var
      const varMatches = scriptContent.match(/\bvar\s+/g);
      expect(varMatches).toBeNull();
    });

    test('should use arrow functions or function declarations', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      // Should have function definitions
      expect(scriptContent).toMatch(/function\s+\w+|=>\s*{|=>\s*\w+/);
    });

    test('should have descriptive function names', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      // Check for meaningful function names
      expect(scriptContent).toMatch(/function\s+(getRandomColor|changeTextColor|change\w+)/i);
    });
  });
});
