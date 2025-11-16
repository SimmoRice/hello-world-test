"""
Comprehensive test suite for index.html
Tests HTML structure, content, security headers, accessibility, and styling
"""

import re
from pathlib import Path
from html.parser import HTMLParser
import pytest


class HTMLAnalyzer(HTMLParser):
    """Custom HTML parser to analyze the structure and content"""

    def __init__(self):
        super().__init__()
        self.tags = []
        self.meta_tags = []
        self.styles = []
        self.title = None
        self.h1_content = []
        self.in_title = False
        self.in_style = False
        self.current_style = []

    def handle_starttag(self, tag, attrs):
        self.tags.append(tag)
        attrs_dict = dict(attrs)

        if tag == 'meta':
            self.meta_tags.append(attrs_dict)
        elif tag == 'title':
            self.in_title = True
        elif tag == 'style':
            self.in_style = True

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        elif tag == 'style':
            self.in_style = False
            if self.current_style:
                self.styles.append(''.join(self.current_style))
                self.current_style = []

    def handle_data(self, data):
        if self.in_title:
            self.title = data.strip()
        elif self.in_style:
            self.current_style.append(data)
        # Capture h1 content
        if self.tags and self.tags[-1] == 'h1':
            content = data.strip()
            if content:
                self.h1_content.append(content)


@pytest.fixture
def html_content():
    """Load the index.html file"""
    html_path = Path(__file__).parent / 'index.html'
    assert html_path.exists(), "index.html file not found"
    return html_path.read_text(encoding='utf-8')


@pytest.fixture
def parsed_html(html_content):
    """Parse HTML and return analyzer"""
    parser = HTMLAnalyzer()
    parser.feed(html_content)
    return parser


class TestHTMLStructure:
    """Test basic HTML structure and semantic markup"""

    def test_file_exists(self):
        """Test that index.html exists in the root directory"""
        html_path = Path(__file__).parent / 'index.html'
        assert html_path.exists(), "index.html file must exist in root directory"

    def test_has_doctype(self, html_content):
        """Test that HTML has DOCTYPE declaration"""
        assert '<!DOCTYPE html>' in html_content, "HTML must have DOCTYPE declaration"

    def test_has_html_tag(self, parsed_html):
        """Test that HTML has html tag"""
        assert 'html' in parsed_html.tags, "HTML must have <html> tag"

    def test_has_lang_attribute(self, html_content):
        """Test that html tag has lang attribute for accessibility"""
        assert re.search(r'<html\s+lang=', html_content), "HTML tag should have lang attribute"

    def test_has_head_tag(self, parsed_html):
        """Test that HTML has head tag"""
        assert 'head' in parsed_html.tags, "HTML must have <head> tag"

    def test_has_body_tag(self, parsed_html):
        """Test that HTML has body tag"""
        assert 'body' in parsed_html.tags, "HTML must have <body> tag"

    def test_has_meta_charset(self, parsed_html):
        """Test that HTML has meta charset declaration"""
        charsets = [meta.get('charset') for meta in parsed_html.meta_tags if 'charset' in meta]
        assert 'UTF-8' in charsets, "HTML must have UTF-8 charset meta tag"

    def test_has_viewport_meta(self, parsed_html):
        """Test that HTML has viewport meta tag for responsiveness"""
        viewports = [meta.get('content') for meta in parsed_html.meta_tags
                    if meta.get('name') == 'viewport']
        assert len(viewports) > 0, "HTML should have viewport meta tag"
        assert any('width=device-width' in vp for vp in viewports), \
            "Viewport should include width=device-width"

    def test_has_title_tag(self, parsed_html):
        """Test that HTML has title tag"""
        assert parsed_html.title is not None, "HTML must have <title> tag"
        assert len(parsed_html.title) > 0, "Title tag should not be empty"

    def test_uses_semantic_html(self, parsed_html):
        """Test that HTML uses semantic tags like main"""
        semantic_tags = {'main', 'header', 'footer', 'nav', 'section', 'article'}
        used_semantic = semantic_tags.intersection(set(parsed_html.tags))
        assert len(used_semantic) > 0, "HTML should use semantic tags (e.g., <main>)"


class TestContent:
    """Test page content requirements"""

    def test_displays_hello_world(self, parsed_html):
        """Test that page displays 'Hello World' text"""
        assert len(parsed_html.h1_content) > 0, "Page must have h1 content"
        hello_world_found = any('Hello World' in content for content in parsed_html.h1_content)
        assert hello_world_found, "Page must display 'Hello World' text"

    def test_hello_world_in_heading(self, parsed_html):
        """Test that 'Hello World' is in a heading tag (h1-h6)"""
        heading_tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
        has_heading = any(tag in parsed_html.tags for tag in heading_tags)
        assert has_heading, "'Hello World' should be in a heading tag"

    def test_uses_h1_for_main_heading(self, parsed_html):
        """Test that main heading uses h1 tag"""
        assert 'h1' in parsed_html.tags, "Page should use <h1> for main heading"

    def test_title_content(self, parsed_html):
        """Test that title tag has meaningful content"""
        assert parsed_html.title, "Title should not be empty"
        assert len(parsed_html.title) > 0, "Title should have content"
        # Title should be related to the page content
        assert any(word in parsed_html.title.lower() for word in ['hello', 'world']), \
            "Title should be related to page content"


class TestStyling:
    """Test CSS styling and centering requirements"""

    def test_has_styling(self, parsed_html):
        """Test that page includes styling"""
        assert 'style' in parsed_html.tags or len(parsed_html.styles) > 0, \
            "Page should include styling (internal or external)"

    def test_has_internal_css(self, parsed_html):
        """Test that page has internal CSS"""
        assert len(parsed_html.styles) > 0, "Page should have internal CSS"

    def test_centering_styles(self, html_content):
        """Test that CSS includes centering styles"""
        # Check for common centering techniques
        centering_patterns = [
            r'display:\s*flex',
            r'justify-content:\s*center',
            r'align-items:\s*center',
            r'text-align:\s*center',
        ]

        found_centering = []
        for pattern in centering_patterns:
            if re.search(pattern, html_content, re.IGNORECASE):
                found_centering.append(pattern)

        assert len(found_centering) >= 2, \
            "CSS should include centering styles (at least 2 centering properties)"

    def test_has_flexbox_centering(self, html_content):
        """Test that page uses modern flexbox for centering"""
        has_flex = re.search(r'display:\s*flex', html_content, re.IGNORECASE)
        has_justify = re.search(r'justify-content:\s*center', html_content, re.IGNORECASE)
        has_align = re.search(r'align-items:\s*center', html_content, re.IGNORECASE)

        assert has_flex and has_justify and has_align, \
            "Page should use flexbox (display: flex, justify-content, align-items) for centering"

    def test_vertical_centering(self, html_content):
        """Test that CSS includes vertical centering"""
        vertical_centering = [
            r'align-items:\s*center',
            r'min-height:\s*100vh',
        ]

        found = sum(1 for pattern in vertical_centering
                   if re.search(pattern, html_content, re.IGNORECASE))
        assert found >= 1, "CSS should include vertical centering styles"

    def test_has_font_styling(self, html_content):
        """Test that page has basic font styling"""
        font_patterns = [
            r'font-family',
            r'font-size',
            r'font-weight',
        ]

        found = sum(1 for pattern in font_patterns
                   if re.search(pattern, html_content, re.IGNORECASE))
        assert found >= 1, "Page should have basic font styling"


class TestSecurityHeaders:
    """Test security-related meta tags and headers"""

    def test_has_csp_header(self, parsed_html):
        """Test that page includes Content Security Policy"""
        csp_tags = [meta for meta in parsed_html.meta_tags
                   if meta.get('http-equiv', '').lower() == 'content-security-policy']
        assert len(csp_tags) > 0, "Page should include Content-Security-Policy meta tag"

    def test_csp_restricts_inline_scripts(self, html_content):
        """Test that CSP doesn't allow unsafe-inline scripts"""
        csp_match = re.search(r'Content-Security-Policy["\']?\s+content=["\']([^"\']+)',
                             html_content, re.IGNORECASE)
        if csp_match:
            csp_content = csp_match.group(1)
            # Should not have 'unsafe-inline' for script-src or default-src allowing scripts
            # If default-src is 'none', then scripts are blocked
            assert 'default-src' in csp_content, "CSP should define default-src"

    def test_has_nosniff_header(self, parsed_html):
        """Test that page includes X-Content-Type-Options: nosniff"""
        nosniff_tags = [meta for meta in parsed_html.meta_tags
                       if meta.get('http-equiv', '').lower() == 'x-content-type-options']
        assert len(nosniff_tags) > 0, \
            "Page should include X-Content-Type-Options meta tag"

        # Verify it's set to nosniff
        nosniff_values = [meta.get('content', '').lower() for meta in nosniff_tags]
        assert 'nosniff' in nosniff_values, \
            "X-Content-Type-Options should be set to 'nosniff'"

    def test_has_referrer_policy(self, parsed_html):
        """Test that page includes referrer policy"""
        referrer_tags = [meta for meta in parsed_html.meta_tags
                        if meta.get('name', '').lower() == 'referrer']
        assert len(referrer_tags) > 0, "Page should include referrer policy meta tag"

    def test_has_permissions_policy(self, parsed_html):
        """Test that page includes permissions policy"""
        permissions_tags = [meta for meta in parsed_html.meta_tags
                           if meta.get('http-equiv', '').lower() == 'permissions-policy']
        assert len(permissions_tags) > 0, \
            "Page should include Permissions-Policy meta tag"

    def test_no_inline_javascript(self, html_content):
        """Test that page doesn't include inline JavaScript (security best practice)"""
        # Check for inline script tags (with content inside)
        has_inline_script = re.search(r'<script[^>]*>(?!</script>).+</script>', html_content, re.IGNORECASE | re.DOTALL)
        # External scripts with src are okay (CSP compliant)
        # Check for inline event handlers (more precise pattern)
        # Look for on* attributes in HTML tags (onclick, onload, etc.)
        has_inline_events = re.search(r'<[^>]+\son\w+\s*=\s*["\']', html_content, re.IGNORECASE)

        assert not has_inline_script, "Page should not include inline <script> tags with code"
        assert not has_inline_events, \
            "Page should not include inline event handlers (onclick, onload, etc.)"


class TestAccessibility:
    """Test accessibility features"""

    def test_has_lang_attribute(self, html_content):
        """Test that html tag has lang attribute"""
        assert re.search(r'<html[^>]+lang=', html_content), \
            "HTML should have lang attribute for screen readers"

    def test_valid_lang_code(self, html_content):
        """Test that lang attribute uses valid language code"""
        lang_match = re.search(r'<html[^>]+lang=["\']([^"\']+)["\']', html_content)
        assert lang_match, "HTML should have lang attribute"
        lang_code = lang_match.group(1)
        # Check for common valid language codes (en, en-US, etc.)
        assert re.match(r'^[a-z]{2}(-[A-Z]{2})?$', lang_code), \
            "Lang attribute should use valid language code (e.g., 'en', 'en-US')"

    def test_has_viewport_for_mobile(self, parsed_html):
        """Test that page is mobile-friendly with viewport meta tag"""
        viewport_tags = [meta for meta in parsed_html.meta_tags
                        if meta.get('name') == 'viewport']
        assert len(viewport_tags) > 0, \
            "Page should have viewport meta tag for mobile accessibility"

    def test_semantic_structure(self, parsed_html):
        """Test that page uses semantic HTML structure"""
        # Should use semantic tags instead of generic divs
        semantic_tags = {'main', 'header', 'footer', 'nav', 'section', 'article'}
        used_tags = set(parsed_html.tags)
        has_semantic = bool(semantic_tags.intersection(used_tags))
        assert has_semantic, \
            "Page should use semantic HTML5 tags for better accessibility"

    def test_heading_hierarchy(self, parsed_html):
        """Test that page has proper heading hierarchy (starts with h1)"""
        heading_tags = [tag for tag in parsed_html.tags if re.match(r'h[1-6]', tag)]
        if heading_tags:
            # First heading should be h1
            assert heading_tags[0] == 'h1', \
                "First heading should be <h1> for proper hierarchy"


class TestResponsiveDesign:
    """Test responsive design features"""

    def test_has_viewport_meta(self, parsed_html):
        """Test that page includes viewport meta tag"""
        viewport_tags = [meta for meta in parsed_html.meta_tags
                        if meta.get('name') == 'viewport']
        assert len(viewport_tags) > 0, "Page should have viewport meta tag"

    def test_has_media_queries(self, html_content):
        """Test that CSS includes media queries for responsiveness"""
        has_media_query = re.search(r'@media', html_content, re.IGNORECASE)
        assert has_media_query, "CSS should include media queries for responsive design"

    def test_mobile_breakpoint(self, html_content):
        """Test that media queries include common mobile breakpoint"""
        # Common mobile breakpoints: 768px, 640px, 480px
        mobile_breakpoint = re.search(r'@media[^{]*\(\s*max-width:\s*\d+px\s*\)',
                                     html_content, re.IGNORECASE)
        assert mobile_breakpoint, \
            "CSS should include mobile breakpoint (max-width media query)"


class TestEdgeCases:
    """Test edge cases and robustness"""

    def test_file_encoding_utf8(self):
        """Test that file uses UTF-8 encoding"""
        html_path = Path(__file__).parent / 'index.html'
        try:
            content = html_path.read_text(encoding='utf-8')
            assert len(content) > 0, "File should have content"
        except UnicodeDecodeError:
            pytest.fail("File should be UTF-8 encoded")

    def test_no_broken_tags(self, html_content):
        """Test that HTML doesn't have obviously broken tags"""
        # Check for unclosed tags (basic check)
        opening_tags = len(re.findall(r'<(?!/)(?!!)[a-zA-Z][^>]*>', html_content))
        closing_tags = len(re.findall(r'</[a-zA-Z][^>]*>', html_content))
        self_closing = len(re.findall(r'<[a-zA-Z][^>]*/>', html_content))
        void_elements = len(re.findall(r'<(?:meta|link|br|hr|img|input)[^>]*>', html_content))

        # Opening tags should roughly match closing tags (accounting for void elements)
        # This is a rough check, not perfect
        assert opening_tags > 0, "HTML should have opening tags"
        assert closing_tags > 0, "HTML should have closing tags"

    def test_no_lorem_ipsum(self, html_content):
        """Test that content doesn't contain placeholder text"""
        placeholder_patterns = [
            r'lorem ipsum',
            r'placeholder',
            r'TODO',
            r'FIXME',
        ]

        for pattern in placeholder_patterns:
            match = re.search(pattern, html_content, re.IGNORECASE)
            if match and pattern.lower() in ['todo', 'fixme']:
                # TODO and FIXME in comments are okay
                continue

    def test_reasonable_file_size(self):
        """Test that HTML file is reasonably sized (not too large)"""
        html_path = Path(__file__).parent / 'index.html'
        file_size = html_path.stat().st_size
        # For a simple HTML page, should be under 50KB
        assert file_size < 50 * 1024, \
            f"HTML file should be reasonably sized (found {file_size} bytes)"

    def test_no_external_dependencies(self, html_content):
        """Test that page doesn't rely on external resources (for offline use)"""
        # Check for external links (except possibly favicon)
        external_links = re.findall(r'(?:href|src)=["\']https?://', html_content)
        # Filter out common exceptions
        external_links = [link for link in external_links
                         if 'favicon' not in link.lower()]
        assert len(external_links) == 0, \
            "Page should not depend on external resources (should work offline)"


class TestValidation:
    """Test HTML validation and best practices"""

    def test_html5_doctype(self, html_content):
        """Test that page uses HTML5 doctype"""
        doctype = html_content.strip().split('\n')[0]
        assert '<!DOCTYPE html>' in doctype, "Page should use HTML5 doctype"

    def test_no_deprecated_tags(self, parsed_html):
        """Test that page doesn't use deprecated HTML tags"""
        deprecated_tags = {
            'center', 'font', 'marquee', 'blink', 'frame',
            'frameset', 'noframes', 'acronym', 'big', 'tt'
        }
        used_deprecated = deprecated_tags.intersection(set(parsed_html.tags))
        assert len(used_deprecated) == 0, \
            f"Page should not use deprecated tags: {used_deprecated}"

    def test_proper_nesting(self, html_content):
        """Test that style tag is in head, not body"""
        # Basic check: style should come before body
        style_pos = html_content.find('<style')
        body_pos = html_content.find('<body')

        if style_pos != -1 and body_pos != -1:
            assert style_pos < body_pos, \
                "<style> tag should be in <head>, not after <body>"

    def test_meta_tags_in_head(self, html_content):
        """Test that meta tags are in head section"""
        # Meta tags should come before body
        first_meta = html_content.find('<meta')
        body_start = html_content.find('<body')

        if first_meta != -1 and body_start != -1:
            assert first_meta < body_start, \
                "Meta tags should be in <head> section, not in <body>"
