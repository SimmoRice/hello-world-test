/**
 * Color Change Button Feature
 * Handles the logic for changing the "Hello World" text color when the button is clicked
 */

// Predefined array of vibrant colors for variety
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
 * @returns {string} A random color hex code
 */
function getRandomColor() {
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
 */
function changeTextColor() {
    const textElement = document.getElementById('hello-text');
    const newColor = getRandomColor();
    textElement.style.color = newColor;
}

// Initialize the event listener when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('color-change-btn');

    // Add click event listener to the button
    button.addEventListener('click', changeTextColor);

    // Optional: Add keyboard support for accessibility (Enter and Space keys)
    button.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            changeTextColor();
        }
    });
});
