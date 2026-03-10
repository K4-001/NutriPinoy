const DataService = {
    config: {
        useAPI: false,
        apiEndpoint: 'https://api.example.com/dishes',
        localDataPath: 'data/dishes.json'
    },

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

    async fetchFromLocal() {
        const response = await fetch(this.config.localDataPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    async fetchFromAPI() {
        const response = await fetch(this.config.apiEndpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            throw new Error(`API error! status: ${response.status}`);
        }
        return await response.json();
    }
};

// ===================================
// GLOBAL STATE
// ===================================

let dishesData = {};
let filteredDishes = {};

// ===================================
// UTILITY FUNCTIONS
// ===================================

function getCalorieValue(dish) {
    const calorieItem = dish.nutrition.find(item => item.nutrient === 'Calories');
    if (calorieItem) {
        return parseInt(calorieItem.value.replace(/[^\d]/g, ''));
    }
    return 0;
}

function getCalorieCategory(calories) {
    if (calories < 300) return 'low';
    if (calories <= 400) return 'medium';
    return 'high';
}

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
// UI RENDERING
// ===================================

function createDishCard(dishKey, dish) {
    const calories = getCalorieValue(dish);
    const calorieCategory = getCalorieCategory(calories);

    const card = document.createElement('div');
    card.className = 'dish-card';
    card.dataset.dish = dishKey;
    card.dataset.calories = calories;
    card.dataset.name = dish.name.toLowerCase();

    card.innerHTML = `
        <img src="${getImagePath(dishKey)}" alt="${dish.name}" onerror="this.src='images/placeholder.jpg'">
        <div class="dish-card-content">
            <h3>${dish.name}</h3>
            <p>${dish.description.substring(0, 80)}...</p>
            <span class="calorie-badge ${calorieCategory}">${calorieCategory}</span>
        </div>
    `;

    card.addEventListener('click', () => {
        showDishDetails(dishKey);
        scrollToNutrition();
    });

    return card;
}

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

function renderDishCards(dishes) {
    const container = document.getElementById('dishes-container');
    container.innerHTML = '';

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

function showDishDetails(dishKey) {
    const dish = dishesData[dishKey];
    if (!dish) {
        console.error('No dish data found for key:', dishKey);
        return;
    }

    const titleElement = document.getElementById('nutrition-title');
    titleElement.textContent = `${dish.name} - Nutritional Information`;

    const ingredientsHtml = `
        <h4>Ingredients</h4>
        <ul class="ingredients-list">
            ${dish.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
        </ul>
    `;

    const nutritionHtml = `
        <h4>Nutrition Facts (per serving)</h4>
        <table class="nutrition-table">
            <thead>
                <tr><th>Nutrient</th><th>Value</th></tr>
            </thead>
            <tbody>
                ${dish.nutrition.map(nut => `
                    <tr><td>${nut.nutrient}</td><td>${nut.value}</td></tr>
                `).join('')}
            </tbody>
        </table>
    `;

    const risksHtml = `
        <div class="health-risk">
            <h4>Health Considerations (When Eaten Often)</h4>
            <ul>
                ${dish.risks.map(risk => `<li>${risk}</li>`).join('')}
            </ul>
        </div>
    `;

    const calories = getCalorieValue(dish);
    const calorieCategory = getCalorieCategory(calories);

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

    const detailsDiv = document.getElementById('dish-details');
    detailsDiv.innerHTML = detailsHtml;
    detailsDiv.classList.remove('hidden');
}

function scrollToNutrition() {
    const nutritionSection = document.getElementById('nutrition');
    if (nutritionSection) {
        nutritionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ===================================
// SEARCH & FILTER
// ===================================

function applyFilters() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
    const calorieFilter = document.getElementById('calorie-filter').value;

    let filtered = { ...dishesData };

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

function setupSearchAndFilter() {
    const searchInput = document.getElementById('search-input');
    const calorieFilter = document.getElementById('calorie-filter');

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => { applyFilters(); }, 300);
    });

    calorieFilter.addEventListener('change', () => { applyFilters(); });
}

// ===================================
// MOBILE MENU
// ===================================

function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const menuContent = document.getElementById('mobile-menu');
    const menuLinks = menuContent.querySelectorAll('a');

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuContent.classList.toggle('show');
    });

    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuContent.classList.remove('show');
        });
    });

    document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !menuContent.contains(e.target)) {
            menuContent.classList.remove('show');
        }
    });
}

// ===================================
// LOADING / ERROR STATES
// ===================================

function showLoading() {
    toggleElement('loading-state', true);
    toggleElement('dishes-container', false);
    toggleElement('error-state', false);
    toggleElement('no-results', false);
}

function hideLoading() {
    toggleElement('loading-state', false);
    toggleElement('dishes-container', true);
}

function showError(error) {
    console.error('Error displaying dishes:', error);
    toggleElement('loading-state', false);
    toggleElement('dishes-container', false);
    toggleElement('error-state', true);
}

// ===================================
// INITIALIZATION
// ===================================

async function initializeApp() {
    console.log('NutriPinoy App Initializing...');
    showLoading();

    try {
        dishesData = await DataService.fetchDishes();
        filteredDishes = { ...dishesData };
        console.log('Dishes loaded:', Object.keys(dishesData).length, 'dishes');

        hideLoading();
        renderDishCards(dishesData);
        setupSearchAndFilter();
        setupMobileMenu();
        setupAuthModals();

        console.log('NutriPinoy App Ready!');
    } catch (error) {
        showError(error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});

// ===================================
// AUTH MODALS
// ===================================

function setupAuthModals() {
    // Open modals
    document.getElementById('loginBtn').addEventListener('click', () => {
        document.getElementById('loginModal').classList.add('active');
    });

    document.getElementById('signupBtn').addEventListener('click', () => {
        document.getElementById('signupModal').classList.add('active');
    });

    // Login submit
    document.querySelector('#loginModal .modal-submit').addEventListener('click', () => {
        const email = document.querySelector('#loginModal input[type="email"]').value.trim();
        const password = document.querySelector('#loginModal input[type="password"]').value.trim();

        if (!email || !password) {
            alert('Please fill in all fields.');
            return;
        }

        // TODO: Replace with real API call when connecting a database
        // fetch('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) })

        closeModal('loginModal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Sign up submit
    document.querySelector('#signupModal .modal-submit').addEventListener('click', () => {
        const name = document.querySelector('#signupModal input[type="text"]').value.trim();
        const email = document.querySelector('#signupModal input[type="email"]').value.trim();
        const password = document.querySelector('#signupModal input[type="password"]').value.trim();

        if (!name || !email || !password) {
            alert('Please fill in all fields.');
            return;
        }

        // TODO: Replace with real API call when connecting a database
        // fetch('/api/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) })

        closeModal('signupModal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        }
    });
}

// Called by modal close buttons (inline onclick in HTML)
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Called by switch links inside modals
function switchModal(closeId, openId) {     
    closeModal(closeId);
    document.getElementById(openId).classList.add('active');
}
