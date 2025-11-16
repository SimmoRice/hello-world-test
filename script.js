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

/**
 * Calculator Feature
 * Handles addition of two numbers and displays the result
 *
 * Security considerations:
 * - Input validation to prevent NaN and invalid calculations
 * - Bounds checking for extremely large numbers
 * - XSS prevention through textContent usage (not innerHTML)
 * - Rate limiting to prevent DoS attacks
 */

// Security: Rate limiting for calculate button to prevent DoS
let lastCalculateTime = 0;
const CALCULATE_RATE_LIMIT_MS = 100; // Minimum 100ms between calculations

// Security: Maximum safe values to prevent overflow and performance issues
const MAX_SAFE_NUMBER = Number.MAX_SAFE_INTEGER; // 9007199254740991
const MIN_SAFE_NUMBER = Number.MIN_SAFE_INTEGER; // -9007199254740991

/**
 * Validate and sanitize numeric input
 * Security: Prevents NaN, Infinity, and out-of-bounds values
 * @param {string} value - The input value to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {Object} Object containing isValid boolean and sanitized number or error message
 */
function validateNumberInput(value, fieldName) {
    // Security: Check for empty or whitespace-only input
    if (!value || value.trim() === '') {
        return {
            isValid: false,
            error: `${fieldName} is required`
        };
    }

    // Security: Parse and validate the number
    const num = parseFloat(value);

    // Security: Check for NaN (invalid number format)
    if (isNaN(num)) {
        return {
            isValid: false,
            error: `${fieldName} must be a valid number`
        };
    }

    // Security: Check for Infinity
    if (!isFinite(num)) {
        return {
            isValid: false,
            error: `${fieldName} is too large`
        };
    }

    // Security: Check for values outside safe integer range
    if (num > MAX_SAFE_NUMBER || num < MIN_SAFE_NUMBER) {
        return {
            isValid: false,
            error: `${fieldName} is outside safe range`
        };
    }

    // Security: Return sanitized number
    return {
        isValid: true,
        value: num
    };
}

/**
 * Add two numbers together with overflow protection
 * Handles both integers and decimal numbers
 * Security: Validates inputs and checks for overflow
 * @param {number} num1 - First number
 * @param {number} num2 - Second number
 * @returns {Object} Object containing success boolean and result or error
 */
function addNumbers(num1, num2) {
    // Security: Additional validation to ensure inputs are numbers
    if (typeof num1 !== 'number' || typeof num2 !== 'number') {
        return {
            success: false,
            error: 'Invalid input types'
        };
    }

    // Security: Check for NaN or Infinity
    if (isNaN(num1) || isNaN(num2) || !isFinite(num1) || !isFinite(num2)) {
        return {
            success: false,
            error: 'Invalid number values'
        };
    }

    const result = num1 + num2;

    // Security: Check if result overflowed to Infinity
    if (!isFinite(result)) {
        return {
            success: false,
            error: 'Result is too large'
        };
    }

    return {
        success: true,
        value: result
    };
}

/**
 * Calculate and display the result of adding two input numbers
 * Security: Comprehensive input validation and error handling
 */
function calculateSum() {
    // Security: Rate limiting to prevent rapid-fire calculations (DoS prevention)
    const currentTime = Date.now();
    if (currentTime - lastCalculateTime < CALCULATE_RATE_LIMIT_MS) {
        return; // Silently ignore if called too frequently
    }
    lastCalculateTime = currentTime;

    const input1 = document.getElementById('number1');
    const input2 = document.getElementById('number2');
    const resultDisplay = document.getElementById('result-display');

    // Security: Validate that all elements exist
    if (!input1 || !input2 || !resultDisplay) {
        // Security: Generic error message to avoid leaking implementation details
        if (resultDisplay) {
            resultDisplay.textContent = 'Result: Error - System unavailable';
        }
        return;
    }

    // Security: Validate and sanitize first input
    const validation1 = validateNumberInput(input1.value, 'First number');
    if (!validation1.isValid) {
        // Security: Use textContent (not innerHTML) to prevent XSS attacks
        resultDisplay.textContent = `Result: ${validation1.error}`;
        return;
    }

    // Security: Validate and sanitize second input
    const validation2 = validateNumberInput(input2.value, 'Second number');
    if (!validation2.isValid) {
        // Security: Use textContent (not innerHTML) to prevent XSS attacks
        resultDisplay.textContent = `Result: ${validation2.error}`;
        return;
    }

    // Security: Perform addition with overflow protection
    const addResult = addNumbers(validation1.value, validation2.value);

    if (!addResult.success) {
        // Security: Display sanitized error message
        resultDisplay.textContent = `Result: ${addResult.error}`;
        return;
    }

    // Security: Display result using textContent (prevents XSS)
    // Format the number to avoid extremely long decimal representations
    const formattedResult = Number.isInteger(addResult.value)
        ? addResult.value
        : addResult.value.toFixed(10).replace(/\.?0+$/, ''); // Remove trailing zeros

    resultDisplay.textContent = `Result: ${formattedResult}`;
}

// Initialize the event listener when the DOM is fully loaded
// Security: Using DOMContentLoaded to ensure safe DOM access
document.addEventListener('DOMContentLoaded', function() {
    // Initialize color change button
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

    // Initialize calculator button
    const calculateBtn = document.getElementById('calculate-btn');

    if (!calculateBtn) {
        console.error('Calculate button not found in DOM');
        return;
    }

    // Add click event listener to the calculate button
    calculateBtn.addEventListener('click', calculateSum);

    // Add keyboard support for Enter key on calculator inputs
    const input1 = document.getElementById('number1');
    const input2 = document.getElementById('number2');

    if (input1 && input2) {
        [input1, input2].forEach(input => {
            input.addEventListener('keydown', function(event) {
                if (event && event.key === 'Enter') {
                    calculateSum();
                }
            });
        });
    }
});
