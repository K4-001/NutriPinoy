// ===================================
// DATA SERVICE LAYER (API-Ready Architecture)
// ===================================

/**
 * DataService handles all data fetching operations.
 * This abstraction makes it easy to switch between local JSON and external API.
 */
const DataService = {
    // Configuration
    config: {
        useAPI: false, // Set to true when ready to use external API
        apiEndpoint: 'https://api.example.com/dishes', // Future API endpoint
        localDataPath: 'data/dishes.json'
    },

    /**
     * Fetch dishes data from configured source
     * @returns {Promise<Object>} Dishes data object
     */
    async fetchDishes() {
        try {
            if (this.config.useAPI) {
                return await this.fetchFromAPI();
            } else {
                return await this.fetchFromLocal();
            }
        } catch (error) {
            console.error('Error fetching dishes:', error);
            throw error;
        }
    },

    /**
     * Fetch from local JSON file
     * @returns {Promise<Object>} Dishes data
     */
    async fetchFromLocal() {
        const response = await fetch(this.config.localDataPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    /**
     * Fetch from external API (future implementation)
     * @returns {Promise<Object>} Dishes data
     */
    async fetchFromAPI() {
        const response = await fetch(this.config.apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    }
};

// ===================================
// GLOBAL STATE MANAGEMENT
// ===================================

let dishesData = {}; // Stores all dishes data
let filteredDishes = {}; // Stores filtered dishes for search/filter

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Get calorie value from dish nutrition data
 * @param {Object} dish - Dish object
 * @returns {number} Calorie value
 */
function getCalorieValue(dish) {
    const calorieItem = dish.nutrition.find(item => item.nutrient === 'Calories');
    if (calorieItem) {
        return parseInt(calorieItem.value.replace(/[^\d]/g, ''));
    }
    return 0;
}

/**
 * Get calorie category (low/medium/high)
 * @param {number} calories - Calorie value
 * @returns {string} Category name
 */
function getCalorieCategory(calories) {
    if (calories < 300) return 'low';
    if (calories <= 400) return 'medium';
    return 'high';
}

/**
 * Show/hide elements by adding/removing 'hidden' class
 * @param {string} elementId - Element ID
 * @param {boolean} show - Show or hide
 */
function toggleElement(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        if (show) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }
}

// ===================================
// UI RENDERING FUNCTIONS
// ===================================

/**
 * Create and render a single dish card
 * @param {string} dishKey - Dish key/ID
 * @param {Object} dish - Dish data object
 * @returns {HTMLElement} Dish card element
 */
function createDishCard(dishKey, dish) {
    const calories = getCalorieValue(dish);
    const calorieCategory = getCalorieCategory(calories);
    
    const card = document.createElement('div');
    card.className = 'dish-card';
    card.dataset.dish = dishKey;
    card.dataset.calories = calories;
    card.dataset.name = dish.name.toLowerCase();
    
    // Construct image path (convert backslashes to forward slashes if needed)
    const imagePath = `images/${dishKey}.jpg`; // You'll need to rename images to match dish keys
    
    card.innerHTML = `
        <img src="${getImagePath(dishKey)}" alt="${dish.name}" onerror="this.src='images/placeholder.jpg'">
        <div class="dish-card-content">
            <h3>${dish.name}</h3>
            <p>${dish.description.substring(0, 80)}...</p>
            <span class="calorie-badge ${calorieCategory}">${calorieCategory}</span>
        </div>
    `;
    
    // Add click event listener
    card.addEventListener('click', () => {
        showDishDetails(dishKey);
        scrollToNutrition();
    });
    
    return card;
}

/**
 * Get correct image path for a dish
 * @param {string} dishKey - Dish key
 * @returns {string} Image path
 */
function getImagePath(dishKey) {
    const imageMap = {
        'adobo': 'images/Filipino Chicken Adobo.jpg',
        'sinigang': 'images/8bf7d8c7-9426-4586-9e6b-55551a574139.jpg',
        'tinola': 'images/Chicken Tinola Recipe.jpg',
        'kare-kare': 'images/Beef Short Rib Kare Kare.jpg',
        'pork-menudo': 'images/pork_menudo.jpg',
        'beef-caldereta': 'images/Caldereta.jpg',
        'pork-sisig': 'images/Filipino Food_ 33 Unique and Popular Dishes to Try for a Taste Adventure.jpg',
        'bicol-express': 'images/Bicol Express Recipe.jpg',
        'lumpiang-shanghai': 'images/Lumpia Shanghai (Filipino Spring Rolls) (1).jpg',
        'pork-humba': 'images/Delight in the rich, comforting flavors of our….jpg'
    };
    
    return imageMap[dishKey] || 'images/placeholder.jpg';
}

/**
 * Render all dish cards to the gallery
 * @param {Object} dishes - Dishes data object
 */
function renderDishCards(dishes) {
    const container = document.getElementById('dishes-container');
    container.innerHTML = ''; // Clear existing cards
    
    const dishKeys = Object.keys(dishes);
    
    if (dishKeys.length === 0) {
        toggleElement('no-results', true);
        return;
    }
    
    toggleElement('no-results', false);
    
    dishKeys.forEach(dishKey => {
        const card = createDishCard(dishKey, dishes[dishKey]);
        container.appendChild(card);
    });
}

/**
 * Show detailed information for a selected dish
 * @param {string} dishKey - Dish key/ID
 */
function showDishDetails(dishKey) {
    const dish = dishesData[dishKey];
    
    if (!dish) {
        console.error('No dish data found for key:', dishKey);
        return;
    }
    
    console.log('Showing details for:', dish.name);
    
    // Update title
    const titleElement = document.getElementById('nutrition-title');
    titleElement.textContent = `${dish.name} - Nutritional Information`;
    
    // Build ingredients list
    const ingredientsHtml = `
        <h4>Ingredients</h4>
        <ul class="ingredients-list">
            ${dish.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
        </ul>
    `;
    
    // Build nutrition table
    const nutritionHtml = `
        <h4>Nutrition Facts (per serving)</h4>
        <table class="nutrition-table">
            <thead>
                <tr>
                    <th>Nutrient</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                ${dish.nutrition.map(nut => `
                    <tr>
                        <td>${nut.nutrient}</td>
                        <td>${nut.value}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Build health risks/considerations
    const risksHtml = `
        <div class="health-risk">
            <h4>Health Considerations (When Eaten Often)</h4>
            <ul>
                ${dish.risks.map(risk => `<li>${risk}</li>`).join('')}
            </ul>
        </div>
    `;
    
    // Get calorie info for badge
    const calories = getCalorieValue(dish);
    const calorieCategory = getCalorieCategory(calories);
    
    // Build complete details HTML with two-column layout
    const detailsHtml = `
        <h3>${dish.name} <span class="calorie-badge ${calorieCategory}">${calories} kcal</span></h3>
        <div class="dish-details-layout">
            <div class="dish-details-left">
                <img src="${getImagePath(dishKey)}" alt="${dish.name}" class="dish-details-image">
                <p><strong>Description:</strong> ${dish.description}</p>
                ${ingredientsHtml}
            </div>
            <div class="dish-details-right">
                ${nutritionHtml}
                ${risksHtml}
            </div>
        </div>
    `;
    
    // Display the details
    const detailsDiv = document.getElementById('dish-details');
    detailsDiv.innerHTML = detailsHtml;
    detailsDiv.classList.remove('hidden');
}

/**
 * Scroll smoothly to nutrition section
 */
function scrollToNutrition() {
    const nutritionSection = document.getElementById('nutrition');
    if (nutritionSection) {
        nutritionSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// ===================================
// SEARCH AND FILTER FUNCTIONS
// ===================================

/**
 * Filter dishes based on search query and calorie filter
 */
function applyFilters() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
    const calorieFilter = document.getElementById('calorie-filter').value;
    
    let filtered = { ...dishesData };
    
    // Apply search filter
    if (searchQuery) {
        filtered = Object.keys(filtered).reduce((result, key) => {
            const dish = filtered[key];
            if (dish.name.toLowerCase().includes(searchQuery) || 
                dish.description.toLowerCase().includes(searchQuery)) {
                result[key] = dish;
            }
            return result;
        }, {});
    }
    
    // Apply calorie filter
    if (calorieFilter !== 'all') {
        filtered = Object.keys(filtered).reduce((result, key) => {
            const dish = filtered[key];
            const calories = getCalorieValue(dish);
            const category = getCalorieCategory(calories);
            
            if (category === calorieFilter) {
                result[key] = dish;
            }
            return result;
        }, {});
    }
    
    filteredDishes = filtered;
    renderDishCards(filtered);
}

/**
 * Setup search and filter event listeners
 */
function setupSearchAndFilter() {
    const searchInput = document.getElementById('search-input');
    const calorieFilter = document.getElementById('calorie-filter');
    
    // Search input - debounced for performance
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFilters();
        }, 300); // Wait 300ms after user stops typing
    });
    
    // Calorie filter dropdown
    calorieFilter.addEventListener('change', () => {
        applyFilters();
    });
}

// ===================================
// MOBILE MENU HANDLER
// ===================================

/**
 * Setup mobile dropdown menu toggle
 */
function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const menuContent = document.getElementById('mobile-menu');
    const menuLinks = menuContent.querySelectorAll('a');
    
    // Toggle menu on button click
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuContent.classList.toggle('show');
    });
    
    // Close menu when clicking a link
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuContent.classList.remove('show');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !menuContent.contains(e.target)) {
            menuContent.classList.remove('show');
        }
    });
}

// ===================================
// LOADING AND ERROR HANDLING
// ===================================

/**
 * Show loading state
 */
function showLoading() {
    toggleElement('loading-state', true);
    toggleElement('dishes-container', false);
    toggleElement('error-state', false);
    toggleElement('no-results', false);
}

/**
 * Hide loading state
 */
function hideLoading() {
    toggleElement('loading-state', false);
    toggleElement('dishes-container', true);
}

/**
 * Show error state
 * @param {Error} error - Error object
 */
function showError(error) {
    console.error('Error displaying dishes:', error);
    toggleElement('loading-state', false);
    toggleElement('dishes-container', false);
    toggleElement('error-state', true);
}

// ===================================
// INITIALIZATION
// ===================================

/**
 * Initialize the application
 */
async function initializeApp() {
    console.log('NutriPinoy App Initializing...');
    
    // Show loading state
    showLoading();
    
    try {
        // Fetch dishes data using DataService
        dishesData = await DataService.fetchDishes();
        filteredDishes = { ...dishesData };
        
        console.log('Dishes loaded successfully:', Object.keys(dishesData).length, 'dishes');
        
        // Hide loading and render dishes
        hideLoading();
        renderDishCards(dishesData);
        
        // Setup search and filter functionality
        setupSearchAndFilter();
        
        // Setup mobile menu
        setupMobileMenu();
        
        console.log('NutriPinoy App Ready!');
        
    } catch (error) {
        // Show error state
        showError(error);
    }
}

// ===================================
// EVENT LISTENERS
// ===================================

/**
 * Wait for DOM to be fully loaded before initializing
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// ===================================
// SMOOTH SCROLLING FOR CTA BUTTONS
// ===================================

/**
 * Add smooth scrolling to all anchor links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Only prevent default for internal links
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ===================================
// EXPORTS FOR TESTING (Optional)
// ===================================

// If you want to test functions in browser console, uncomment:
// window.NutriPinoy = {
//     DataService,
//     showDishDetails,
//     applyFilters,
//     dishesData
// };