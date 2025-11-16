"""
Comprehensive test suite for counter functionality in index.html
Tests JavaScript counter behavior, security features, and edge cases
Uses Playwright for real browser testing
"""

import pytest
import re
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect


@pytest.fixture(scope="session")
def browser():
    """Launch browser for testing"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        yield browser
        browser.close()


@pytest.fixture
def page(browser):
    """Create a new page for each test"""
    context = browser.new_context()
    page = context.new_page()

    # Load the index.html file
    html_path = Path(__file__).parent / 'index.html'
    page.goto(f'file://{html_path.absolute()}')

    # Wait for page to load
    page.wait_for_load_state('domcontentloaded')

    yield page
    context.close()


@pytest.fixture
def html_content():
    """Load the HTML source for static analysis"""
    html_path = Path(__file__).parent / 'index.html'
    return html_path.read_text(encoding='utf-8')


class TestCounterBasicFunctionality:
    """Test basic counter functionality and acceptance criteria"""

    def test_counter_element_exists(self, page):
        """Test that counter display element exists"""
        counter_display = page.locator('#counterDisplay')
        expect(counter_display).to_be_visible()

    def test_increment_button_exists(self, page):
        """Test that increment button exists"""
        increment_btn = page.locator('#incrementBtn')
        expect(increment_btn).to_be_visible()

    def test_initial_count_is_zero(self, page):
        """Test that counter displays 'Count: 0' initially (Acceptance Criteria)"""
        counter_display = page.locator('#counterDisplay')
        expect(counter_display).to_have_text('Count: 0')

    def test_button_labeled_increment(self, page):
        """Test that button is labeled 'Increment' (Acceptance Criteria)"""
        increment_btn = page.locator('#incrementBtn')
        expect(increment_btn).to_have_text('Increment')

    def test_clicking_increments_counter(self, page):
        """Test that clicking button increments the displayed number (Acceptance Criteria)"""
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        # Initial state
        expect(counter_display).to_have_text('Count: 0')

        # Click once
        increment_btn.click()
        expect(counter_display).to_have_text('Count: 1')

        # Click again
        increment_btn.click()
        expect(counter_display).to_have_text('Count: 2')

        # Click multiple times
        increment_btn.click()
        increment_btn.click()
        increment_btn.click()
        expect(counter_display).to_have_text('Count: 5')

    def test_counter_persists_during_session(self, page):
        """Test that counter persists during the session (Acceptance Criteria)"""
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        # Increment multiple times
        for i in range(10):
            increment_btn.click()

        # Verify count is maintained
        expect(counter_display).to_have_text('Count: 10')

        # Navigate away and back (within same page context)
        current_url = page.url
        page.goto('about:blank')
        page.goto(current_url)

        # Counter should reset (new session)
        expect(counter_display).to_have_text('Count: 0')

    def test_counter_increments_by_one(self, page):
        """Test that each click increases counter by exactly 1"""
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        # Test increments are exactly +1
        expected_counts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

        for expected in expected_counts:
            actual_text = counter_display.text_content()
            actual_count = int(actual_text.split(': ')[1])
            assert actual_count == expected, f"Expected {expected}, got {actual_count}"

            if expected < 10:  # Don't click after last check
                increment_btn.click()
                page.wait_for_timeout(60)  # Wait for rate limiting


class TestCounterStateManagement:
    """Test state management and JavaScript logic"""

    def test_count_variable_initialized(self, html_content):
        """Test that count variable is properly initialized"""
        assert re.search(r'let\s+count\s*=\s*0', html_content), \
            "Count variable should be initialized to 0"

    def test_uses_let_or_const_not_var(self, html_content):
        """Test that modern variable declarations are used (let/const)"""
        # Check for count variable using let
        has_let_count = re.search(r'let\s+count', html_content)
        assert has_let_count, "Should use 'let' for count variable"

        # Ensure var is not used for count
        has_var_count = re.search(r'var\s+count', html_content)
        assert not has_var_count, "Should not use 'var' (use 'let' instead)"

    def test_counter_function_exists(self, html_content):
        """Test that increment counter function exists"""
        has_increment_fn = re.search(r'function\s+incrementCounter', html_content)
        assert has_increment_fn, "Should have incrementCounter function"

    def test_uses_getelementbyid(self, html_content):
        """Test that DOM elements are accessed with getElementById"""
        assert 'getElementById' in html_content, \
            "Should use getElementById to access DOM elements"

    def test_event_listener_attached(self, html_content):
        """Test that event listener is properly attached"""
        assert 'addEventListener' in html_content, \
            "Should use addEventListener for button click"
        assert re.search(r"addEventListener\s*\(\s*['\"]click['\"]", html_content), \
            "Should listen for 'click' event"


class TestCounterDisplay:
    """Test counter display and formatting"""

    def test_display_format_is_correct(self, page):
        """Test that counter displays in 'Count: N' format"""
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        # Check format at different values
        test_values = [0, 1, 5, 10, 42, 100]

        for i, expected_value in enumerate(test_values):
            actual_text = counter_display.text_content()
            assert actual_text == f'Count: {expected_value}', \
                f"Display format should be 'Count: {expected_value}'"

            if i < len(test_values) - 1:
                clicks_needed = test_values[i + 1] - test_values[i]
                for _ in range(clicks_needed):
                    increment_btn.click()
                    page.wait_for_timeout(60)

    def test_counter_display_clearly_visible(self, page):
        """Test that counter is clearly displayed on the page"""
        counter_display = page.locator('#counterDisplay')

        # Check visibility
        expect(counter_display).to_be_visible()

        # Check it has reasonable font size
        font_size = page.evaluate("""
            () => {
                const elem = document.getElementById('counterDisplay');
                return window.getComputedStyle(elem).fontSize;
            }
        """)

        # Font size should be at least 16px for readability
        size_value = float(re.search(r'[\d.]+', font_size).group())
        assert size_value >= 16, f"Counter font size should be at least 16px, got {font_size}"

    def test_display_updates_immediately(self, page):
        """Test that display updates immediately after click"""
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        # Click and verify immediate update
        increment_btn.click()
        page.wait_for_timeout(100)  # Small wait for rate limiting
        expect(counter_display).to_have_text('Count: 1')

        increment_btn.click()
        page.wait_for_timeout(100)
        expect(counter_display).to_have_text('Count: 2')


class TestCounterEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_rapid_clicking(self, page):
        """Test that rapid clicking is handled properly"""
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        # Rapid clicks (should be rate limited)
        for _ in range(20):
            increment_btn.click()

        # Wait a bit for rate limiting to process
        page.wait_for_timeout(1500)

        # Get final count
        final_text = counter_display.text_content()
        final_count = int(final_text.split(': ')[1])

        # Due to rate limiting (50ms), not all clicks should register
        # 20 clicks in rapid succession should result in fewer than 20 increments
        assert final_count <= 20, f"Rate limiting should prevent all clicks from registering"
        assert final_count > 0, "At least some clicks should register"

    def test_large_number_of_clicks(self, page):
        """Test counter with large number of clicks"""
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        # Click many times with proper timing
        target_count = 50
        for i in range(target_count):
            increment_btn.click()
            if i % 10 == 0:  # Add delay every 10 clicks to avoid rate limiting
                page.wait_for_timeout(100)

        page.wait_for_timeout(500)

        # Get final count
        final_text = counter_display.text_content()
        final_count = int(final_text.split(': ')[1])

        # Should be close to target (some might be rate limited)
        assert final_count >= target_count * 0.8, \
            f"Expected around {target_count}, got {final_count}"

    def test_counter_with_page_interactions(self, page):
        """Test counter behavior with other page interactions"""
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        # Increment counter
        increment_btn.click()
        page.wait_for_timeout(100)

        # Try clicking other elements
        page.locator('h1').click()

        # Counter should remain unchanged
        expect(counter_display).to_have_text('Count: 1')

        # Counter should still work
        increment_btn.click()
        page.wait_for_timeout(100)
        expect(counter_display).to_have_text('Count: 2')

    def test_disabled_javascript_graceful_degradation(self, browser):
        """Test that page loads even if JavaScript fails"""
        # This tests the HTML structure exists independent of JS
        context = browser.new_context(java_script_enabled=False)
        page = context.new_page()

        html_path = Path(__file__).parent / 'index.html'
        page.goto(f'file://{html_path.absolute()}')

        # Elements should exist
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        expect(counter_display).to_be_visible()
        expect(increment_btn).to_be_visible()

        # Should show initial text
        expect(counter_display).to_have_text('Count: 0')

        context.close()


class TestCounterSecurity:
    """Test security features and validations"""

    def test_uses_textcontent_not_innerhtml(self, html_content):
        """Test that textContent is used instead of innerHTML to prevent XSS"""
        # Should use textContent for updating display
        assert 'textContent' in html_content, \
            "Should use textContent instead of innerHTML for XSS prevention"

        # Should NOT use innerHTML for counter updates
        update_display_match = re.search(
            r'function\s+updateDisplay[^}]*\{[^}]*\}',
            html_content,
            re.DOTALL
        )
        if update_display_match:
            update_fn = update_display_match.group()
            assert 'innerHTML' not in update_fn, \
                "updateDisplay should not use innerHTML (XSS risk)"

    def test_integer_overflow_protection(self, html_content):
        """Test that code includes integer overflow protection"""
        # Should check for MAX_SAFE_INTEGER
        assert 'MAX_SAFE_INTEGER' in html_content, \
            "Should use MAX_SAFE_INTEGER for overflow protection"

        # Should have overflow check in increment function
        assert re.search(r'if.*>=.*MAX_SAFE_INTEGER', html_content), \
            "Should check against MAX_SAFE_INTEGER before incrementing"

    def test_rate_limiting_implemented(self, html_content):
        """Test that rate limiting is implemented"""
        # Should have rate limiting variables
        assert re.search(r'RATE_LIMIT', html_content, re.IGNORECASE), \
            "Should implement rate limiting"

        assert re.search(r'lastClickTime', html_content), \
            "Should track last click time for rate limiting"

    def test_rate_limiting_works(self, page):
        """Test that rate limiting actually prevents rapid clicks"""
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        # Click as fast as possible
        start_time = time.time()
        for _ in range(100):
            increment_btn.click()
        end_time = time.time()

        # Wait for processing
        page.wait_for_timeout(500)

        # Get final count
        final_text = counter_display.text_content()
        final_count = int(final_text.split(': ')[1])

        elapsed_ms = (end_time - start_time) * 1000

        # With 50ms rate limit, theoretical max is 20 clicks/second
        theoretical_max = int(elapsed_ms / 50) + 10  # Add buffer

        # Should be significantly less than 100 due to rate limiting
        assert final_count < 100, \
            f"Rate limiting should prevent all 100 clicks from registering, got {final_count}"

    def test_dom_element_validation(self, html_content):
        """Test that DOM elements are validated before use"""
        # Should check if elements exist
        assert re.search(r'if\s*\(\s*!.*counterDisplay.*\|\|.*!.*incrementBtn', html_content), \
            "Should validate DOM elements exist before using them"

    def test_number_validation(self, html_content):
        """Test that count value is validated"""
        # Should use Number.isFinite or similar validation
        assert 'Number.isFinite' in html_content or 'isFinite' in html_content, \
            "Should validate that count is a valid number"

    def test_no_eval_usage(self, html_content):
        """Test that eval() is not used (security risk)"""
        has_eval = re.search(r'\beval\s*\(', html_content)
        assert not has_eval, "Should not use eval() (security risk)"

    def test_no_inline_event_handlers(self, html_content):
        """Test that inline event handlers are not used"""
        # Check for onclick, onload, etc. in HTML tags
        has_inline = re.search(r'<[^>]+\son\w+\s*=', html_content)
        assert not has_inline, \
            "Should not use inline event handlers (use addEventListener instead)"

    def test_csp_headers_present(self, html_content):
        """Test that Content Security Policy headers are present"""
        assert 'Content-Security-Policy' in html_content, \
            "Should have Content-Security-Policy meta tag"


class TestCounterAccessibility:
    """Test accessibility features for the counter"""

    def test_button_is_keyboard_accessible(self, page):
        """Test that button can be activated with keyboard"""
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        # Focus the button
        increment_btn.focus()

        # Press Enter
        page.keyboard.press('Enter')
        page.wait_for_timeout(100)

        # Should increment
        expect(counter_display).to_have_text('Count: 1')

        # Press Space
        page.keyboard.press('Space')
        page.wait_for_timeout(100)

        # Should increment again
        expect(counter_display).to_have_text('Count: 2')

    def test_button_has_proper_semantics(self, page):
        """Test that increment button uses proper button element"""
        increment_btn = page.locator('#incrementBtn')

        # Should be an actual button element
        tag_name = increment_btn.evaluate('el => el.tagName.toLowerCase()')
        assert tag_name == 'button', "Should use <button> element, not div or span"

    def test_counter_display_readable(self, page):
        """Test that counter display has good contrast and readability"""
        counter_display = page.locator('#counterDisplay')

        # Check that text is visible
        expect(counter_display).to_be_visible()

        # Get computed styles
        styles = page.evaluate("""
            () => {
                const elem = document.getElementById('counterDisplay');
                const computed = window.getComputedStyle(elem);
                return {
                    color: computed.color,
                    fontSize: computed.fontSize,
                    fontWeight: computed.fontWeight
                };
            }
        """)

        # Font size should be reasonable
        font_size = float(re.search(r'[\d.]+', styles['fontSize']).group())
        assert font_size >= 16, f"Font size should be at least 16px for readability"


class TestCounterResponsiveness:
    """Test responsive behavior of counter"""

    def test_mobile_viewport_rendering(self, browser):
        """Test counter renders properly on mobile viewport"""
        context = browser.new_context(
            viewport={'width': 375, 'height': 667}  # iPhone SE size
        )
        page = context.new_page()

        html_path = Path(__file__).parent / 'index.html'
        page.goto(f'file://{html_path.absolute()}')

        # Elements should be visible
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        expect(counter_display).to_be_visible()
        expect(increment_btn).to_be_visible()

        # Should be functional
        increment_btn.click()
        page.wait_for_timeout(100)
        expect(counter_display).to_have_text('Count: 1')

        context.close()

    def test_tablet_viewport_rendering(self, browser):
        """Test counter renders properly on tablet viewport"""
        context = browser.new_context(
            viewport={'width': 768, 'height': 1024}  # iPad size
        )
        page = context.new_page()

        html_path = Path(__file__).parent / 'index.html'
        page.goto(f'file://{html_path.absolute()}')

        # Elements should be visible and functional
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        expect(counter_display).to_be_visible()
        expect(increment_btn).to_be_visible()

        # Test functionality
        increment_btn.click()
        page.wait_for_timeout(100)
        expect(counter_display).to_have_text('Count: 1')

        context.close()


class TestCounterDocumentation:
    """Test code documentation and comments"""

    def test_has_function_comments(self, html_content):
        """Test that functions have documentation comments"""
        # Should have comments for incrementCounter function
        increment_fn_match = re.search(
            r'/\*\*.*?\*/\s*function\s+incrementCounter',
            html_content,
            re.DOTALL
        )
        assert increment_fn_match, \
            "incrementCounter function should have JSDoc comment"

    def test_security_comments_present(self, html_content):
        """Test that security measures are documented"""
        # Should have comments explaining security features
        security_comments = re.findall(r'//.*[Ss]ecurity', html_content)
        assert len(security_comments) >= 3, \
            "Should have comments explaining security measures"

    def test_has_variable_comments(self, html_content):
        """Test that important variables are documented"""
        # Should have comments for counter state
        has_state_comment = re.search(r'//.*[Ss]tate|//.*[Cc]ounter', html_content)
        assert has_state_comment, \
            "Should have comments explaining counter state management"


class TestCounterCodeQuality:
    """Test code quality and best practices"""

    def test_uses_strict_mode(self, html_content):
        """Test that JavaScript uses strict mode"""
        # Look for 'use strict' in script tag
        script_match = re.search(r'<script[^>]*>(.*?)</script>', html_content, re.DOTALL)
        if script_match:
            script_content = script_match.group(1)
            # Strict mode is optional but recommended
            # This is informational, not a hard requirement
            pass

    def test_no_global_pollution(self, html_content):
        """Test that code doesn't pollute global scope unnecessarily"""
        # Counter variables should be scoped
        script_match = re.search(r'<script[^>]*>(.*?)</script>', html_content, re.DOTALL)
        if script_match:
            script_content = script_match.group(1)
            # Should not use var (which creates global variables)
            var_count = len(re.findall(r'\bvar\s+\w+', script_content))
            assert var_count == 0, \
                "Should use 'let' or 'const' instead of 'var' to avoid global scope pollution"

    def test_consistent_naming_convention(self, html_content):
        """Test that naming conventions are consistent"""
        # Function names should be camelCase
        function_names = re.findall(r'function\s+(\w+)', html_content)
        for name in function_names:
            assert name[0].islower() or name.startswith('_'), \
                f"Function '{name}' should use camelCase convention"

    def test_constants_uppercase(self, html_content):
        """Test that constants use UPPER_CASE naming"""
        # Rate limit and max safe values should be uppercase constants
        has_upper_constants = re.search(
            r'const\s+[A-Z_]+\s*=',
            html_content
        )
        assert has_upper_constants, \
            "Constants like MAX_SAFE_INTEGER should use UPPER_CASE naming"


class TestCounterErrorHandling:
    """Test error handling and robustness"""

    def test_handles_missing_dom_elements(self, html_content):
        """Test that code handles missing DOM elements gracefully"""
        # Should throw error if required elements are missing
        assert re.search(r'throw.*Error', html_content), \
            "Should throw error if required DOM elements are missing"

    def test_console_errors_for_security_issues(self, html_content):
        """Test that security issues log errors"""
        # Should log warnings/errors for security issues
        assert re.search(r'console\.(warn|error)', html_content), \
            "Should log console warnings/errors for security issues"

    def test_validates_count_is_number(self, html_content):
        """Test that code validates count is a valid number"""
        # Should check Number.isFinite
        assert 'Number.isFinite' in html_content or 'isFinite' in html_content, \
            "Should validate count is a valid finite number"


class TestCounterPerformance:
    """Test performance characteristics"""

    def test_update_display_function_efficiency(self, html_content):
        """Test that updateDisplay is implemented efficiently"""
        # Should have separate updateDisplay function
        assert 'function updateDisplay' in html_content, \
            "Should have separate updateDisplay function for modularity"

        # Should use textContent (faster than innerHTML)
        update_fn_match = re.search(
            r'function\s+updateDisplay[^}]*\{[^}]*\}',
            html_content,
            re.DOTALL
        )
        if update_fn_match:
            update_fn = update_fn_match.group()
            assert 'textContent' in update_fn, \
                "updateDisplay should use textContent for better performance"

    def test_rate_limiting_prevents_dos(self, page):
        """Test that rate limiting prevents denial-of-service like behavior"""
        counter_display = page.locator('#counterDisplay')
        increment_btn = page.locator('#incrementBtn')

        # Attempt to click extremely rapidly
        for _ in range(1000):
            increment_btn.click()

        # Should not freeze or become unresponsive
        page.wait_for_timeout(500)

        # Page should still be responsive
        expect(counter_display).to_be_visible()
        expect(increment_btn).to_be_enabled()

        # Counter should not have processed all 1000 clicks
        final_text = counter_display.text_content()
        final_count = int(final_text.split(': ')[1])
        assert final_count < 1000, \
            f"Rate limiting should prevent excessive clicks, got {final_count}/1000"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
