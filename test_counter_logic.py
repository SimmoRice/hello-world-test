"""
Comprehensive test suite for counter functionality in index.html
Tests JavaScript counter logic, security features, and edge cases
These tests validate the implementation without requiring a browser
"""

import pytest
import re
from pathlib import Path


@pytest.fixture
def html_content():
    """Load the HTML source for analysis"""
    html_path = Path(__file__).parent / 'index.html'
    return html_path.read_text(encoding='utf-8')


@pytest.fixture
def javascript_code(html_content):
    """Extract JavaScript code from HTML"""
    script_match = re.search(r'<script[^>]*>(.*?)</script>', html_content, re.DOTALL)
    if script_match:
        return script_match.group(1)
    return ""


class TestCounterRequirements:
    """Test that implementation meets all requirements"""

    def test_counter_display_element_exists(self, html_content):
        """Test that counter display element exists with ID"""
        assert 'id="counterDisplay"' in html_content, \
            "Must have element with id='counterDisplay'"

    def test_increment_button_exists(self, html_content):
        """Test that increment button exists with ID"""
        assert 'id="incrementBtn"' in html_content, \
            "Must have button with id='incrementBtn'"

    def test_initial_count_display(self, html_content):
        """Test that counter displays 'Count: 0' initially (Requirement)"""
        # Check HTML content for initial display
        assert 'Count: 0' in html_content, \
            "Counter must display 'Count: 0' initially"

    def test_button_labeled_increment(self, html_content):
        """Test that button is labeled 'Increment' (Requirement)"""
        # Find button text
        button_match = re.search(
            r'<button[^>]*id="incrementBtn"[^>]*>(.*?)</button>',
            html_content,
            re.DOTALL | re.IGNORECASE
        )
        assert button_match, "Button element must exist"

        button_text = button_match.group(1).strip()
        assert 'Increment' in button_text, \
            "Button must be labeled 'Increment'"

    def test_counter_state_initialized(self, javascript_code):
        """Test that counter state starts at 0 (Requirement)"""
        # Check that count variable is initialized to 0
        assert re.search(r'let\s+count\s*=\s*0', javascript_code), \
            "Counter must be initialized to 0"


class TestCounterFunctionalityLogic:
    """Test counter functionality logic"""

    def test_increment_function_exists(self, javascript_code):
        """Test that incrementCounter function exists"""
        assert 'function incrementCounter' in javascript_code, \
            "Must have incrementCounter function"

    def test_increment_increases_by_one(self, javascript_code):
        """Test that increment logic increases count by 1"""
        # Check for count++ or count += 1 or count = count + 1
        increment_patterns = [
            r'\bcount\s*\+\+',
            r'\bcount\s*\+=\s*1',
            r'\bcount\s*=\s*count\s*\+\s*1'
        ]

        has_increment = any(
            re.search(pattern, javascript_code)
            for pattern in increment_patterns
        )

        assert has_increment, \
            "Must increment count by 1 (using count++, count+=1, or count=count+1)"

    def test_update_display_function_exists(self, javascript_code):
        """Test that updateDisplay function exists"""
        assert 'function updateDisplay' in javascript_code, \
            "Should have updateDisplay function for modular code"

    def test_display_format_uses_template(self, javascript_code):
        """Test that display uses 'Count: ' format"""
        # Check for template string or concatenation with "Count: "
        count_format_patterns = [
            r'Count:\s*\$\{count\}',  # Template literal
            r'["\']Count:\s*["\'].*count',  # String concatenation
        ]

        has_format = any(
            re.search(pattern, javascript_code)
            for pattern in count_format_patterns
        )

        assert has_format, \
            "Display should use 'Count: ${count}' or 'Count: ' + count format"

    def test_event_listener_attached_to_button(self, javascript_code):
        """Test that click event listener is attached to button"""
        # Check for addEventListener on incrementBtn
        assert 'incrementBtn.addEventListener' in javascript_code, \
            "Must attach event listener to incrementBtn"

        # Should listen for 'click' event
        assert re.search(r"addEventListener\s*\(\s*['\"]click['\"]", javascript_code), \
            "Should listen for 'click' event"

    def test_event_listener_calls_increment_function(self, javascript_code):
        """Test that event listener calls incrementCounter"""
        # Check that addEventListener references incrementCounter
        listener_pattern = r"addEventListener\s*\(\s*['\"]click['\"]\s*,\s*incrementCounter\s*\)"
        assert re.search(listener_pattern, javascript_code), \
            "Click event should call incrementCounter function"

    def test_dom_elements_retrieved(self, javascript_code):
        """Test that DOM elements are retrieved"""
        assert 'getElementById' in javascript_code or 'querySelector' in javascript_code, \
            "Must retrieve DOM elements using getElementById or querySelector"

        # Check for counterDisplay
        assert re.search(r"getElementById\s*\(\s*['\"]counterDisplay['\"]", javascript_code), \
            "Must get counterDisplay element"

        # Check for incrementBtn
        assert re.search(r"getElementById\s*\(\s*['\"]incrementBtn['\"]", javascript_code), \
            "Must get incrementBtn element"


class TestCounterStateManagement:
    """Test state management implementation"""

    def test_uses_modern_variable_declaration(self, javascript_code):
        """Test that let/const is used instead of var"""
        # Check that count uses let
        assert re.search(r'let\s+count', javascript_code), \
            "Should use 'let' for count variable"

        # Ensure var is not used
        var_usage = re.findall(r'\bvar\s+\w+', javascript_code)
        assert len(var_usage) == 0, \
            f"Should not use 'var' (found: {var_usage}). Use 'let' or 'const' instead"

    def test_const_for_dom_elements(self, javascript_code):
        """Test that const is used for DOM element references"""
        # DOM elements should be const since they don't change
        assert re.search(r'const\s+counterDisplay', javascript_code), \
            "Should use 'const' for counterDisplay (DOM reference doesn't change)"

        assert re.search(r'const\s+incrementBtn', javascript_code), \
            "Should use 'const' for incrementBtn (DOM reference doesn't change)"

    def test_state_not_in_global_scope(self, javascript_code):
        """Test that state is properly scoped"""
        # Count should be defined within script, not as window property
        assert not re.search(r'window\.count\s*=', javascript_code), \
            "Should not pollute global window object"

        assert not re.search(r'var\s+count', javascript_code), \
            "Should use 'let' instead of 'var' to avoid global scope"


class TestCounterSecurity:
    """Test security features and validations"""

    def test_uses_textcontent_not_innerhtml(self, javascript_code):
        """Test that textContent is used instead of innerHTML (XSS prevention)"""
        # Should use textContent
        assert 'textContent' in javascript_code, \
            "Must use textContent instead of innerHTML for XSS prevention"

        # Check that innerHTML is NOT used for counter updates
        inner_html_usage = re.findall(r'\.innerHTML\s*=', javascript_code)
        assert len(inner_html_usage) == 0, \
            f"Should NOT use innerHTML (XSS risk). Found {len(inner_html_usage)} uses"

    def test_integer_overflow_protection_defined(self, javascript_code):
        """Test that integer overflow protection constants are defined"""
        assert 'MAX_SAFE_INTEGER' in javascript_code, \
            "Should define MAX_SAFE_INTEGER for overflow protection"

        # Should store in a constant
        assert re.search(r'const\s+MAX_SAFE_COUNT\s*=.*MAX_SAFE_INTEGER', javascript_code), \
            "Should define MAX_SAFE_COUNT constant"

    def test_integer_overflow_protection_used(self, javascript_code):
        """Test that overflow protection is implemented in increment function"""
        # Should check against MAX before incrementing
        # Look for the overflow check pattern
        has_overflow_check = re.search(
            r'if\s*\(\s*count\s*>=\s*MAX_SAFE',
            javascript_code
        )
        assert has_overflow_check, \
            "incrementCounter must check for integer overflow before incrementing"

    def test_rate_limiting_implemented(self, javascript_code):
        """Test that rate limiting is implemented"""
        # Should have rate limit constant
        assert re.search(r'RATE_LIMIT', javascript_code, re.IGNORECASE), \
            "Should implement rate limiting with RATE_LIMIT constant"

        # Should track last click time
        assert 'lastClickTime' in javascript_code, \
            "Should track lastClickTime for rate limiting"

        # Should use Date.now() for timing
        assert 'Date.now()' in javascript_code, \
            "Should use Date.now() for rate limiting timing"

    def test_rate_limiting_check_in_increment(self, javascript_code):
        """Test that rate limiting check is in increment function"""
        increment_fn_match = re.search(
            r'function\s+incrementCounter\s*\([^)]*\)\s*\{(.*?)\n\s*\}',
            javascript_code,
            re.DOTALL
        )

        if increment_fn_match:
            increment_fn = increment_fn_match.group(1)

            # Should check time difference
            has_rate_check = re.search(
                r'if\s*\([^)]*lastClickTime.*RATE_LIMIT',
                increment_fn
            )
            assert has_rate_check, \
                "incrementCounter must check rate limiting"

            # Should return early if rate limited
            assert 'return' in increment_fn, \
                "Should return early if rate limited"

    def test_dom_element_validation(self, javascript_code):
        """Test that DOM elements are validated before use"""
        # Should check if elements exist
        validation_patterns = [
            r'if\s*\(\s*!counterDisplay\s*\|\|\s*!incrementBtn',
            r'if\s*\(\s*!incrementBtn\s*\|\|\s*!counterDisplay',
        ]

        has_validation = any(
            re.search(pattern, javascript_code)
            for pattern in validation_patterns
        )

        assert has_validation, \
            "Must validate that DOM elements exist before using them"

        # Should throw error if missing
        assert re.search(r'throw.*Error', javascript_code), \
            "Should throw Error if required elements are missing"

    def test_number_validation(self, javascript_code):
        """Test that count is validated as a number"""
        # Should use Number.isFinite or isFinite
        assert 'Number.isFinite' in javascript_code or 'isFinite' in javascript_code, \
            "Should validate count is a finite number using Number.isFinite()"

        # Should reset to 0 if invalid
        if 'Number.isFinite' in javascript_code:
            validation_context = re.search(
                r'if\s*\(\s*!Number\.isFinite.*\{[^}]*count\s*=\s*0',
                javascript_code,
                re.DOTALL
            )
            assert validation_context, \
                "Should reset count to 0 if it's not a valid number"

    def test_no_eval_usage(self, javascript_code):
        """Test that eval() is not used (security risk)"""
        has_eval = re.search(r'\beval\s*\(', javascript_code)
        assert not has_eval, \
            "Must NOT use eval() - it's a major security risk"

    def test_no_function_constructor(self, javascript_code):
        """Test that Function constructor is not used (security risk)"""
        has_function_constructor = re.search(r'new\s+Function\s*\(', javascript_code)
        assert not has_function_constructor, \
            "Must NOT use Function constructor - it's similar to eval()"

    def test_no_document_write(self, javascript_code):
        """Test that document.write is not used"""
        has_doc_write = re.search(r'document\.write', javascript_code)
        assert not has_doc_write, \
            "Must NOT use document.write - it's a security and performance risk"

    def test_no_inline_event_handlers(self, html_content):
        """Test that inline event handlers are not used"""
        # Check for onclick, onload, etc.
        inline_handlers = re.findall(
            r'<[^>]+\son\w+\s*=',
            html_content
        )
        assert len(inline_handlers) == 0, \
            f"Must NOT use inline event handlers (onclick, etc.). Found {len(inline_handlers)} uses"

    def test_uses_addeventlistener(self, javascript_code):
        """Test that addEventListener is used for events"""
        assert 'addEventListener' in javascript_code, \
            "Must use addEventListener instead of inline event handlers"


class TestCounterCodeQuality:
    """Test code quality and best practices"""

    def test_proper_function_naming(self, javascript_code):
        """Test that functions use camelCase naming"""
        function_names = re.findall(r'function\s+(\w+)', javascript_code)

        for name in function_names:
            assert name[0].islower() or name.startswith('_'), \
                f"Function '{name}' should use camelCase (start with lowercase)"

    def test_constants_use_uppercase(self, javascript_code):
        """Test that constants use UPPER_CASE naming"""
        # Check for RATE_LIMIT, MAX_SAFE_COUNT, etc.
        constants = re.findall(r'const\s+([A-Z_]+)\s*=', javascript_code)

        # Should have at least 2 uppercase constants (rate limit, max safe)
        assert len(constants) >= 2, \
            f"Should use UPPER_CASE for constants. Found: {constants}"

    def test_has_code_comments(self, javascript_code):
        """Test that code includes explanatory comments"""
        # Count comment lines
        single_comments = len(re.findall(r'//.*\n', javascript_code))
        block_comments = len(re.findall(r'/\*.*?\*/', javascript_code, re.DOTALL))

        total_comments = single_comments + block_comments

        assert total_comments >= 5, \
            f"Code should have sufficient comments. Found {total_comments} comments"

    def test_has_security_comments(self, javascript_code):
        """Test that security measures are documented"""
        # Count individual security comments (not multi-line blocks as one)
        security_comment_lines = [
            line for line in javascript_code.split('\n')
            if 'security' in line.lower() and ('//' in line or '/*' in line or '*' in line)
        ]

        assert len(security_comment_lines) >= 3, \
            f"Should document security measures. Found {len(security_comment_lines)} security comment lines"

    def test_function_documentation(self, javascript_code):
        """Test that functions have JSDoc-style comments"""
        # Check for function documentation
        functions_with_docs = re.findall(
            r'/\*\*.*?\*/\s*function',
            javascript_code,
            re.DOTALL
        )

        assert len(functions_with_docs) >= 2, \
            f"Functions should have JSDoc documentation. Found {len(functions_with_docs)}"


class TestCounterEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_handles_rapid_clicking_with_rate_limit(self, javascript_code):
        """Test that code has rate limiting for rapid clicks"""
        # Already tested in security, but verify logic
        assert 'RATE_LIMIT' in javascript_code, \
            "Must have rate limiting to handle rapid clicks"

    def test_max_value_handling(self, javascript_code):
        """Test that maximum value is handled"""
        # Should check against MAX_SAFE_INTEGER
        assert re.search(r'count\s*>=\s*MAX_SAFE', javascript_code), \
            "Should check if count has reached maximum safe value"

        # Should not increment beyond max
        max_check_context = re.search(
            r'if\s*\([^)]*count\s*>=\s*MAX_SAFE[^)]*\)\s*\{[^}]*return',
            javascript_code,
            re.DOTALL
        )
        assert max_check_context, \
            "Should return early if count has reached maximum"

    def test_invalid_number_handling(self, javascript_code):
        """Test that invalid numbers are handled"""
        # Should check Number.isFinite
        assert 'Number.isFinite(count)' in javascript_code or 'isFinite(count)' in javascript_code, \
            "Should check if count is a valid finite number"

    def test_missing_elements_handling(self, javascript_code):
        """Test that missing DOM elements are handled"""
        # Should throw error if elements missing
        error_throw = re.search(
            r'if\s*\(\s*![^)]*\)\s*\{[^}]*throw.*Error',
            javascript_code,
            re.DOTALL
        )
        assert error_throw, \
            "Should throw error if required DOM elements are missing"


class TestCounterAccessibility:
    """Test accessibility features"""

    def test_uses_button_element(self, html_content):
        """Test that actual button element is used (not div/span)"""
        # Check that incrementBtn is a <button> element
        button_match = re.search(
            r'<button[^>]*id="incrementBtn"',
            html_content,
            re.IGNORECASE
        )
        assert button_match, \
            "Must use <button> element for increment button, not <div> or <span>"

    def test_counter_has_semantic_container(self, html_content):
        """Test that counter uses semantic HTML"""
        # Should use div or semantic element for counter display
        counter_match = re.search(
            r'<(div|section|article)[^>]*id="counterDisplay"',
            html_content,
            re.IGNORECASE
        )
        assert counter_match, \
            "Counter display should use semantic HTML element"

    def test_proper_element_ids(self, html_content):
        """Test that elements have descriptive IDs"""
        # Check for meaningful IDs
        assert 'id="counterDisplay"' in html_content, \
            "Counter display should have descriptive ID"
        assert 'id="incrementBtn"' in html_content, \
            "Button should have descriptive ID"


class TestCounterDocumentation:
    """Test documentation and code clarity"""

    def test_has_state_management_comment(self, javascript_code):
        """Test that state management is documented"""
        state_comment = re.search(
            r'//.*[Ss]tate.*management|//.*[Cc]ounter.*state',
            javascript_code
        )
        assert state_comment, \
            "Should document counter state management"

    def test_has_security_explanations(self, javascript_code):
        """Test that security features are explained"""
        # Should explain security measures
        security_features = [
            'rate limiting',
            'overflow',
            'XSS',
            'textContent',
            'validation'
        ]

        comments = re.findall(r'//.*|/\*.*?\*/', javascript_code, re.DOTALL)
        comment_text = ' '.join(comments).lower()

        found_features = [
            feature for feature in security_features
            if feature.lower() in comment_text
        ]

        assert len(found_features) >= 3, \
            f"Should document security features. Found: {found_features}"

    def test_has_function_descriptions(self, javascript_code):
        """Test that key functions are described"""
        # Check for JSDoc comments
        jsdoc_comments = re.findall(
            r'/\*\*.*?\*/',
            javascript_code,
            re.DOTALL
        )

        assert len(jsdoc_comments) >= 2, \
            f"Should have JSDoc comments for functions. Found {len(jsdoc_comments)}"


class TestCounterInitialization:
    """Test initialization logic"""

    def test_display_initialized_on_load(self, javascript_code):
        """Test that display is initialized on page load"""
        # Should call updateDisplay on load
        assert re.search(r'updateDisplay\s*\(\s*\)', javascript_code), \
            "Should call updateDisplay() to initialize display"

        # updateDisplay call should be outside any function (at script level)
        # This ensures it runs on page load

    def test_event_listener_added_after_dom_load(self, javascript_code):
        """Test that event listeners are added after DOM elements exist"""
        # Elements should be retrieved before addEventListener
        get_elements = javascript_code.find('getElementById')
        add_listener = javascript_code.find('addEventListener')

        assert get_elements < add_listener, \
            "Should retrieve DOM elements before adding event listeners"

    def test_initialization_order(self, javascript_code):
        """Test that initialization happens in correct order"""
        # Order should be: constants, state, DOM retrieval, validation, event setup, display
        lines = javascript_code.split('\n')

        const_line = next((i for i, line in enumerate(lines) if 'const MAX_SAFE' in line), -1)
        let_line = next((i for i, line in enumerate(lines) if 'let count' in line), -1)
        getelem_line = next((i for i, line in enumerate(lines) if 'getElementById' in line), -1)

        assert const_line < let_line, "Constants should be defined before state"
        assert let_line < getelem_line, "State should be initialized before DOM access"


class TestCounterPerformance:
    """Test performance-related implementation"""

    def test_uses_textcontent_for_performance(self, javascript_code):
        """Test that textContent is used (faster than innerHTML)"""
        # textContent is faster and more secure
        assert 'textContent' in javascript_code, \
            "Should use textContent for better performance and security"

    def test_minimal_dom_access(self, javascript_code):
        """Test that DOM elements are cached"""
        # Should store element references in variables
        assert re.search(r'const\s+counterDisplay\s*=.*getElementById', javascript_code), \
            "Should cache DOM element references in variables"

        assert re.search(r'const\s+incrementBtn\s*=.*getElementById', javascript_code), \
            "Should cache button reference in variable"

    def test_separate_update_function(self, javascript_code):
        """Test that display update is in separate function"""
        # Separate function is more maintainable and testable
        assert 'function updateDisplay' in javascript_code, \
            "Should have separate updateDisplay function for modularity"


class TestSecurityHeaders:
    """Test security headers in HTML"""

    def test_has_content_security_policy(self, html_content):
        """Test that CSP meta tag is present"""
        assert 'Content-Security-Policy' in html_content, \
            "Should have Content-Security-Policy meta tag"

    def test_has_xss_protection(self, html_content):
        """Test that X-Content-Type-Options is set"""
        assert 'X-Content-Type-Options' in html_content, \
            "Should have X-Content-Type-Options: nosniff"

        assert 'nosniff' in html_content, \
            "X-Content-Type-Options should be set to nosniff"

    def test_has_referrer_policy(self, html_content):
        """Test that referrer policy is set"""
        assert 'referrer' in html_content.lower(), \
            "Should have referrer policy meta tag"


class TestCounterIntegration:
    """Test integration between HTML and JavaScript"""

    def test_button_id_matches_javascript(self, html_content, javascript_code):
        """Test that button ID in HTML matches JavaScript"""
        # HTML should have id="incrementBtn"
        assert 'id="incrementBtn"' in html_content

        # JavaScript should reference same ID
        assert 'getElementById(\'incrementBtn\')' in javascript_code or \
               'getElementById("incrementBtn")' in javascript_code

    def test_display_id_matches_javascript(self, html_content, javascript_code):
        """Test that display ID in HTML matches JavaScript"""
        # HTML should have id="counterDisplay"
        assert 'id="counterDisplay"' in html_content

        # JavaScript should reference same ID
        assert 'getElementById(\'counterDisplay\')' in javascript_code or \
               'getElementById("counterDisplay")' in javascript_code

    def test_initial_html_matches_javascript(self, html_content, javascript_code):
        """Test that initial HTML display matches JavaScript initialization"""
        # HTML should show "Count: 0"
        assert 'Count: 0' in html_content

        # JavaScript should initialize count to 0
        assert 'let count = 0' in javascript_code


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
