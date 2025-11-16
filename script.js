/**
 * Color Change Button Feature
 * Handles the logic for changing the "Hello World" text color when the button is clicked
 *
 * Security considerations:
 * - Uses predefined color array (no user input for colors)
 * - No dynamic code execution or eval()
 * - Validates DOM elements exist before manipulation
 * - Event listeners properly scoped and validated
 */

// Predefined array of vibrant colors for variety
// Security: Using hardcoded, safe color values to prevent injection attacks
const colors = [
    '#FF6B6B', // Coral Red
    '#4ECDC4', // Turquoise
    '#FFD93D', // Golden Yellow
    '#95E1D3', // Mint Green
    '#F38181', // Light Coral
    '#AA96DA', // Lavender Purple
    '#FCBAD3', // Pink
    '#A8E6CF', // Soft Green
    '#FFD3B6', // Peach
    '#FFAAA5', // Salmon
    '#FF8B94', // Rose
    '#C7CEEA', // Periwinkle
];

// Keep track of the last color used to avoid repetition
let lastColorIndex = -1;

/**
 * Get a random color from the predefined array, ensuring it's different from the last one
 * Security: Uses Math.random() for non-cryptographic randomness (acceptable for UI color selection)
 * @returns {string} A random color hex code
 */
function getRandomColor() {
    // Security: Validate colors array exists and has content
    if (!Array.isArray(colors) || colors.length === 0) {
        console.error('Colors array is invalid or empty');
        return '#FFFFFF'; // Fallback to white if colors array is compromised
    }

    let newIndex;

    // Ensure we don't get the same color twice in a row
    do {
        newIndex = Math.floor(Math.random() * colors.length);
    } while (newIndex === lastColorIndex && colors.length > 1);

    lastColorIndex = newIndex;
    return colors[newIndex];
}

/**
 * Change the color of the "Hello World" text
 * Security: Validates DOM element exists before manipulation to prevent null reference errors
 */
function changeTextColor() {
    const textElement = document.getElementById('hello-text');

    // Security: Check if element exists before attempting to modify it
    if (!textElement) {
        console.error('Text element not found in DOM');
        return;
    }

    const newColor = getRandomColor();

    // Security: Validate color format before applying (hex color format)
    if (!/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
        console.error('Invalid color format detected');
        return;
    }

    textElement.style.color = newColor;
}

// Initialize the event listener when the DOM is fully loaded
// Security: Using DOMContentLoaded to ensure safe DOM access
document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('color-change-btn');

    // Security: Validate button element exists before attaching event listeners
    if (!button) {
        console.error('Color change button not found in DOM');
        return;
    }

    // Add click event listener to the button
    // Security: Using addEventListener (not inline onclick) to maintain CSP compliance
    button.addEventListener('click', changeTextColor);

    // Optional: Add keyboard support for accessibility (Enter and Space keys)
    // Security: Properly validate event and key values before processing
    button.addEventListener('keydown', function(event) {
        // Security: Validate event object exists
        if (!event || typeof event.key !== 'string') {
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault(); // Prevent default behavior (e.g., page scroll on space)
            changeTextColor();
        }
    });
});
