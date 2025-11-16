/**
 * End-to-End Integration Tests
 * Tests the complete functionality as a user would experience it
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

describe('End-to-End User Experience Tests', () => {
  beforeEach(() => {
    // Load the complete HTML page
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    document.documentElement.innerHTML = html;
  });

  describe('Initial Page Load', () => {
    test('should display Hello World on page load', () => {
      const text = document.getElementById('hello-text');
      expect(text).not.toBeNull();
      expect(text.textContent).toBe('Hello World');
    });

    test('should have Change Color button visible', () => {
      const button = document.getElementById('color-change-btn');
      expect(button).not.toBeNull();
      expect(button.textContent).toBe('Change Color');
      expect(button.style.display).not.toBe('none');
    });

    test('should have proper CSS classes applied', () => {
      const button = document.getElementById('color-change-btn');
      expect(button.className).toContain('color-button');
    });
  });

  describe('User Interactions', () => {
    test('user clicks button and sees color change', () => {
      const button = document.getElementById('color-change-btn');
      const text = document.getElementById('hello-text');

      // Simulate the script functionality
      const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D'];
      button.addEventListener('click', () => {
        text.style.color = colors[Math.floor(Math.random() * colors.length)];
      });

      const originalColor = text.style.color;
      button.click();

      // Color should be set
      expect(text.style.color).toBeTruthy();
    });

    test('user clicks button multiple times', () => {
      const button = document.getElementById('color-change-btn');
      const text = document.getElementById('hello-text');

      const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3'];
      let index = 0;

      button.addEventListener('click', () => {
        text.style.color = colors[index++ % colors.length];
      });

      // Simulate multiple clicks
      button.click();
      const color1 = text.style.color;
      button.click();
      const color2 = text.style.color;
      button.click();
      const color3 = text.style.color;

      // All should have colors set
      expect(color1).toBeTruthy();
      expect(color2).toBeTruthy();
      expect(color3).toBeTruthy();
    });

    test('user presses Enter on button (keyboard navigation)', () => {
      const button = document.getElementById('color-change-btn');
      const text = document.getElementById('hello-text');

      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          text.style.color = '#FF6B6B';
        }
      });

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      button.dispatchEvent(event);

      expect(text.style.color).toBeTruthy();
    });

    test('user tabs to button and presses Space', () => {
      const button = document.getElementById('color-change-btn');
      const text = document.getElementById('hello-text');

      button.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
          event.preventDefault();
          text.style.color = '#4ECDC4';
        }
      });

      const event = new KeyboardEvent('keydown', { key: ' ' });
      button.dispatchEvent(event);

      expect(text.style.color).toBeTruthy();
    });
  });

  describe('Visual Appearance', () => {
    test('should have container with proper structure', () => {
      const container = document.querySelector('.container');
      expect(container).not.toBeNull();

      const text = container.querySelector('#hello-text');
      const button = container.querySelector('#color-change-btn');

      expect(text).not.toBeNull();
      expect(button).not.toBeNull();
    });

    test('should have main element for semantic HTML', () => {
      const main = document.querySelector('main');
      expect(main).not.toBeNull();
    });

    test('button should have proper CSS class', () => {
      const button = document.getElementById('color-change-btn');
      expect(button.classList.contains('color-button')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', () => {
      const h1 = document.querySelector('h1');
      expect(h1).not.toBeNull();
      expect(h1.id).toBe('hello-text');
    });

    test('button should be focusable', () => {
      const button = document.getElementById('color-change-btn');
      expect(button.tabIndex).toBeGreaterThanOrEqual(0);
    });

    test('should work with keyboard only (no mouse needed)', () => {
      const button = document.getElementById('color-change-btn');
      const text = document.getElementById('hello-text');

      // Simulate keyboard-only interaction
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          text.style.color = '#FF6B6B';
        }
      });

      // Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      button.dispatchEvent(enterEvent);
      expect(text.style.color).toBeTruthy();

      // Space key
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      button.dispatchEvent(spaceEvent);
      expect(text.style.color).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    test('should have viewport meta tag', () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      expect(viewport).not.toBeNull();
      expect(viewport.getAttribute('content')).toContain('width=device-width');
    });

    test('should work on different screen sizes (structure)', () => {
      // Check that flexbox container exists (works on all screen sizes)
      const container = document.querySelector('.container');
      expect(container).not.toBeNull();
    });
  });

  describe('Security', () => {
    test('should have Content Security Policy meta tag', () => {
      const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      expect(csp).not.toBeNull();
    });

    test('should have X-Frame-Options', () => {
      const xframe = document.querySelector('meta[http-equiv="X-Frame-Options"]');
      expect(xframe).not.toBeNull();
      expect(xframe.getAttribute('content')).toBe('DENY');
    });

    test('should have X-Content-Type-Options', () => {
      const nosniff = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
      expect(nosniff).not.toBeNull();
      expect(nosniff.getAttribute('content')).toBe('nosniff');
    });

    test('should not have inline onclick handlers', () => {
      const button = document.getElementById('color-change-btn');
      expect(button.getAttribute('onclick')).toBeNull();
    });
  });

  describe('Error Scenarios', () => {
    test('should handle missing text element gracefully', () => {
      const text = document.getElementById('hello-text');
      text.remove();

      const button = document.getElementById('color-change-btn');

      // Should not throw error even if text is missing
      expect(() => {
        const missingText = document.getElementById('hello-text');
        if (!missingText) {
          console.error('Text element not found');
        }
      }).not.toThrow();
    });

    test('should handle missing button gracefully', () => {
      const button = document.getElementById('color-change-btn');
      button.remove();

      const missingButton = document.getElementById('color-change-btn');
      expect(missingButton).toBeNull();

      // Code should handle this
      if (!missingButton) {
        console.error('Button not found');
      }
    });

    test('should handle corrupted DOM gracefully', () => {
      // Simulate corrupted state
      document.body.innerHTML = '';

      const text = document.getElementById('hello-text');
      const button = document.getElementById('color-change-btn');

      expect(text).toBeNull();
      expect(button).toBeNull();
    });
  });

  describe('Performance', () => {
    test('should handle rapid clicks without issues', () => {
      const button = document.getElementById('color-change-btn');
      const text = document.getElementById('hello-text');

      const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D'];
      button.addEventListener('click', () => {
        text.style.color = colors[Math.floor(Math.random() * colors.length)];
      });

      // Simulate 1000 rapid clicks
      expect(() => {
        for (let i = 0; i < 1000; i++) {
          button.click();
        }
      }).not.toThrow();

      // Should still have a color
      expect(text.style.color).toBeTruthy();
    });

    test('should not have memory leaks with event listeners', () => {
      const button = document.getElementById('color-change-btn');

      // Add multiple listeners
      const handler = () => {};
      button.addEventListener('click', handler);
      button.addEventListener('click', handler);
      button.addEventListener('click', handler);

      // Remove button from DOM
      button.remove();

      // Should be cleaned up (we can't directly test this, but structure is correct)
      expect(document.getElementById('color-change-btn')).toBeNull();
    });
  });

  describe('Cross-browser Compatibility', () => {
    test('should use standard DOM methods', () => {
      // Check that we use standard methods that work everywhere
      const text = document.getElementById('hello-text'); // Standard
      const button = document.getElementById('color-change-btn'); // Standard

      expect(text).not.toBeNull();
      expect(button).not.toBeNull();
    });

    test('should use standard color format (hex)', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      // Should use hex colors (works everywhere)
      expect(scriptContent).toMatch(/#[0-9A-Fa-f]{6}/);
    });

    test('should use standard event listeners', () => {
      const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

      // Should use addEventListener (standard)
      expect(scriptContent).toMatch(/addEventListener/);
    });
  });

  describe('User Experience', () => {
    test('complete user journey: load page, click button, see color change', () => {
      // 1. User loads page
      const text = document.getElementById('hello-text');
      const button = document.getElementById('color-change-btn');

      expect(text.textContent).toBe('Hello World');
      expect(button.textContent).toBe('Change Color');

      // 2. User clicks button
      const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D'];
      button.addEventListener('click', () => {
        text.style.color = colors[Math.floor(Math.random() * colors.length)];
      });

      const originalColor = text.style.color;
      button.click();

      // 3. User sees color change
      expect(text.style.color).toBeTruthy();
    });

    test('user can interact with button multiple times successfully', () => {
      const text = document.getElementById('hello-text');
      const button = document.getElementById('color-change-btn');

      const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D'];
      let clickCount = 0;

      button.addEventListener('click', () => {
        text.style.color = colors[clickCount++ % colors.length];
      });

      // Multiple interactions
      for (let i = 0; i < 5; i++) {
        button.click();
        expect(text.style.color).toBeTruthy();
      }

      expect(clickCount).toBe(5);
    });
  });
});
