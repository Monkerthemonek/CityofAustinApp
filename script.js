// Global variables
let currentUser = null;
let businesses = [];
let userFavorites = [];
let userReviews = [];
let recentlyViewed = [];
let map = null;
let userLocation = null;
let filteredBusinesses = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load user data from localStorage
    loadUserData();
    
    // Initialize map functionality if on map page
    if (window.location.pathname.includes('map.html')) {
        initializeMap();
    }
    
    // Initialize authentication forms
    initializeAuthForms();
    
    // Initialize profile functionality
    initializeProfile();
    
    // Initialize search functionality
    initializeSearch();
    
    // Initialize interactive elements
    initializeInteractiveElements();
    // Map locations are loaded from the published Google Sheet.
}

// User data management
function loadUserData() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showUserProfile();
    }
}

function saveUserData() {
    if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

// Authentication functionality
function initializeAuthForms() {
    const loginForm = document.getElementById('login-form-element');
    const signupForm = document.getElementById('signup-form-element');
    const authTabs = document.querySelectorAll('.auth-tab');

    // Handle tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchAuthTab(targetTab);
        });
    });

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }

    // Handle signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSignup();
        });
    }

    // Handle social login
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const provider = this.textContent.trim().toLowerCase();
            handleSocialLogin(provider);
        });
    });
}

function switchAuthTab(tabName) {
    // Remove active class from all tabs and forms
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });

    // Add active class to selected tab and form
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-form`).classList.add('active');
}

function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Simple validation
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Simulate login (in real app, this would be an API call)
    currentUser = {
        id: Date.now(),
        name: email.split('@')[0],
        email: email,
        bio: 'Local business enthusiast',
        profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'
    };

    saveUserData();
    showNotification('Login successful!', 'success');
    showUserProfile();
    
    // Redirect to profile or map
    setTimeout(() => {
        window.location.href = 'account.html';
    }, 1000);
}

function handleSignup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const agreeTerms = document.getElementById('agree-terms').checked;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    if (!agreeTerms) {
        showNotification('Please agree to the terms and conditions', 'error');
        return;
    }

    // Simulate signup (in real app, this would be an API call)
    currentUser = {
        id: Date.now(),
        name: name,
        email: email,
        bio: 'New LocalLens user',
        profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'
    };

    saveUserData();
    showNotification('Account created successfully!', 'success');
    showUserProfile();
    
    // Redirect to profile
    setTimeout(() => {
        window.location.href = 'account.html';
    }, 1000);
}

function handleSocialLogin(provider) {
    showNotification(`Logging in with ${provider}...`, 'info');
    
    // Simulate social login
    setTimeout(() => {
        currentUser = {
            id: Date.now(),
            name: `${provider} User`,
            email: `${provider}@example.com`,
            bio: `Logged in with ${provider}`,
            profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'
        };

        saveUserData();
        showNotification(`${provider} login successful!`, 'success');
        showUserProfile();
        
        setTimeout(() => {
            window.location.href = 'account.html';
        }, 1000);
    }, 1500);
}

function showUserProfile() {
    const authSection = document.getElementById('auth-section');
    const profileSection = document.getElementById('profile-section');

    if (authSection && profileSection) {
        authSection.style.display = 'none';
        profileSection.style.display = 'block';
        
        // Update profile information
        document.getElementById('profile-username').textContent = currentUser.name;
        document.getElementById('profile-bio').textContent = currentUser.bio;
        document.getElementById('profile-picture').src = currentUser.profilePicture;
    }
}

// Profile functionality
function initializeProfile() {
    const profileTabs = document.querySelectorAll('.profile-tab');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const changeProfilePic = document.getElementById('change-profile-pic');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const editProfileForm = document.getElementById('edit-profile-form');
    const closeBtn = document.querySelector('.close-btn');

    // Handle profile tab switching
    profileTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchProfileTab(targetTab);
        });
    });

    // Handle edit profile
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            if (editProfileModal) {
                editProfileModal.classList.add('show');
            }
        });
    }

    // Handle change profile picture
    if (changeProfilePic) {
        changeProfilePic.addEventListener('click', function() {
            // Simulate profile picture change
            const randomSeed = Math.random().toString(36).substring(7);
            currentUser.profilePicture = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face&seed=${randomSeed}`;
            document.getElementById('profile-picture').src = currentUser.profilePicture;
            saveUserData();
            showNotification('Profile picture updated!', 'success');
        });
    }

    // Handle edit profile form
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleEditProfile();
        });
    }

    // Handle modal close
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (editProfileModal) {
                editProfileModal.classList.remove('show');
            }
        });
    }

    // Handle modal click outside
    if (editProfileModal) {
        editProfileModal.addEventListener('click', function(e) {
            if (e.target === editProfileModal) {
                editProfileModal.classList.remove('show');
            }
        });
    }

    // Load profile data
    loadProfileData();
}

function switchProfileTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.profile-content').forEach(content => {
        content.classList.remove('active');
    });

    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load relevant data for the tab
    switch(tabName) {
        case 'favorites':
            loadFavorites();
            break;
        case 'recent':
            loadRecentlyViewed();
            break;
        case 'reviews':
            loadUserReviews();
            break;
    }
}

function handleEditProfile() {
    const name = document.getElementById('edit-name').value;
    const bio = document.getElementById('edit-bio').value;
    const email = document.getElementById('edit-email').value;

    currentUser.name = name;
    currentUser.bio = bio;
    currentUser.email = email;

    saveUserData();
    
    // Update profile display
    document.getElementById('profile-username').textContent = name;
    document.getElementById('profile-bio').textContent = bio;

    // Close modal and show notification
    document.getElementById('edit-profile-modal').classList.remove('show');
    showNotification('Profile updated successfully!', 'success');
}

function loadProfileData() {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('userFavorites');
    if (savedFavorites) {
        userFavorites = JSON.parse(savedFavorites);
    }

    // Load reviews from localStorage
    const savedReviews = localStorage.getItem('userReviews');
    if (savedReviews) {
        userReviews = JSON.parse(savedReviews);
    }

    // Load recently viewed from localStorage
    const savedRecent = localStorage.getItem('recentlyViewed');
    if (savedRecent) {
        recentlyViewed = JSON.parse(savedRecent);
    }
}

function loadFavorites() {
    const favoritesGrid = document.querySelector('.favorites-grid');
    if (!favoritesGrid) return;

    favoritesGrid.innerHTML = '';

    if (userFavorites.length === 0) {
        favoritesGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No favorites yet. Start exploring and add some businesses to your favorites!</p>';
        return;
    }

    userFavorites.forEach(businessId => {
        const business = businesses.find(b => b.id === businessId);
        if (business) {
            const favoriteItem = createFavoriteItem(business);
            favoritesGrid.appendChild(favoriteItem);
        }
    });
}

function createFavoriteItem(business) {
    const div = document.createElement('div');
    div.className = 'favorite-item';
    div.innerHTML = `
        <img src="${business.image}" alt="${business.name}">
        <div class="favorite-info">
            <h4>${business.name}</h4>
            <div class="favorite-rating">
                <i class="fas fa-star"></i>
                <span>${business.rating}</span>
            </div>
            <p>${business.category} • ${business.price}</p>
            <button class="remove-favorite" onclick="removeFavorite(${business.id})">
                <i class="fas fa-heart-broken"></i>
                Remove
            </button>
        </div>
    `;
    return div;
}

function removeFavorite(businessId) {
    userFavorites = userFavorites.filter(id => id !== businessId);
    localStorage.setItem('userFavorites', JSON.stringify(userFavorites));
    loadFavorites();
    showNotification('Removed from favorites', 'success');
}

function loadRecentlyViewed() {
    const recentList = document.querySelector('.recent-list');
    if (!recentList) return;

    recentList.innerHTML = '';

    if (recentlyViewed.length === 0) {
        recentList.innerHTML = '<p style="text-align: center; color: #666;">No recently viewed businesses yet.</p>';
        return;
    }

    recentlyViewed.forEach(business => {
        const recentItem = createRecentItem(business);
        recentList.appendChild(recentItem);
    });
}

function createRecentItem(business) {
    const div = document.createElement('div');
    div.className = 'recent-item';
    div.innerHTML = `
        <div class="recent-info">
            <h4>${business.name}</h4>
            <p>Visited ${business.viewedAgo}</p>
            <div class="recent-rating">
                <i class="fas fa-star"></i>
                <span>${business.rating}</span>
            </div>
        </div>
        <a href="#" class="view-again-btn" onclick="viewBusinessDetails(${business.id})">View Again</a>
    `;
    return div;
}

function loadUserReviews() {
    const reviewsList = document.querySelector('.reviews-list');
    if (!reviewsList) return;

    reviewsList.innerHTML = '';

    if (userReviews.length === 0) {
        reviewsList.innerHTML = '<p style="text-align: center; color: #666;">No reviews yet. Start reviewing businesses!</p>';
        return;
    }

    userReviews.forEach(review => {
        const reviewItem = createReviewItem(review);
        reviewsList.appendChild(reviewItem);
    });
}

function createReviewItem(review) {
    const div = document.createElement('div');
    div.className = 'review-item';
    div.innerHTML = `
        <div class="review-header">
            <h4>${review.businessName}</h4>
            <div class="review-stars">
                ${generateStarRating(review.rating)}
            </div>
            <span class="review-date">${review.dateAgo}</span>
        </div>
        <p class="review-text">${review.text}</p>
        <button class="edit-review-btn" onclick="editReview(${review.id})">
            <i class="fas fa-edit"></i>
            Edit Review
        </button>
    `;
    return div;
}

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// Map functionality
function initializeMap() {
    get_user_location();
    setupMapControls();
    loadBusinessList();
}

function get_user_location() {
    const locationStatus = document.getElementById('location-status');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                locationStatus.textContent = 'Location found! Loading businesses...';
                loadBusinessesNearUser();
            },
            function(error) {
                locationStatus.textContent = 'Location access denied. Using default Austin location.';
                // Default Austin coordinates
                userLocation = {
                    lat: 30.2672,
                    lng: -97.7431
                };
                loadBusinessesNearUser();
            }
        );
    } else {
        locationStatus.textContent = 'Geolocation not supported. Using default Austin location.';
        userLocation = {
            lat: 30.2672,
            lng: -97.7431
        };
        loadBusinessesNearUser();
    }
}

function setupMapControls() {
    const toggleMapBtn = document.getElementById('toggle-map');
    const filterBtn = document.getElementById('filter-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    const applyFiltersBtn = document.getElementById('apply-filters');

    if (toggleMapBtn) {
        toggleMapBtn.addEventListener('click', toggleMapSize);
    }

    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            filterDropdown.classList.toggle('show');
        });
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.filter-container')) {
            filterDropdown.classList.remove('show');
        }
    });
}

function toggleMapSize() {
    const mapContainer = document.getElementById('map-container');
    const toggleBtn = document.getElementById('toggle-map');
    
    if (mapContainer) {
        if (mapContainer.style.gridArea === '1 / 1 / 2 / 3') {
            mapContainer.style.gridArea = '1 / 1 / 2 / 2';
            toggleBtn.innerHTML = '<i class="fas fa-expand-alt"></i> Expand Map';
        } else {
            mapContainer.style.gridArea = '1 / 1 / 2 / 3';
            toggleBtn.innerHTML = '<i class="fas fa-compress-alt"></i> Collapse Map';
        }
    }
}

function loadBusinessesNearUser() {
    // Simulate loading businesses near user
    setTimeout(() => {
        const mapPlaceholder = document.querySelector('.map-placeholder');
        if (mapPlaceholder) {
            mapPlaceholder.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-map-marked-alt" style="font-size: 3rem; color: #667eea; margin-bottom: 20px;"></i>
                    <h3>Map Loaded</h3>
                    <p>Showing businesses near you</p>
                    <p style="color: #666; font-size: 0.9rem;">Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}</p>
                </div>
            `;
        }
        loadBusinessList();
    }, 2000);
}

function loadBusinessList() {
    const businessList = document.getElementById('business-list');
    if (!businessList) return;

    // Filter businesses by user location (simulate distance)
    filteredBusinesses = businesses.map(business => ({
        ...business,
        distance: calculateDistance(userLocation.lat, userLocation.lng, business.lat, business.lng)
    })).filter(business => business.distance < 10) // Within 10 miles

    displayBusinessList(filteredBusinesses);
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    // Simple distance calculation (not accurate but good for demo)
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function displayBusinessList(businessList) {
    const businessListElement = document.getElementById('business-list');
    if (!businessListElement) return;

    businessListElement.innerHTML = '';

    if (businessList.length === 0) {
        businessListElement.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No businesses found in your area.</p>';
        return;
    }

    businessList.forEach(business => {
        const businessItem = createBusinessItem(business);
        businessListElement.appendChild(businessItem);
    });
}

function createBusinessItem(business) {
    const div = document.createElement('div');
    div.className = 'business-item';
    div.innerHTML = `
        <div class="business-info">
            <h4>${business.name}</h4>
            <div class="business-rating">
                <i class="fas fa-star"></i>
                <span>${business.rating}</span>
            </div>
            <p class="business-category">${business.category}</p>
            <p class="business-price">${business.price}</p>
            <p class="business-distance">${business.distance.toFixed(1)} miles away</p>
        </div>
        <div class="business-actions">
            <button class="favorite-btn" onclick="toggleFavorite(${business.id})">
                <i class="${userFavorites.includes(business.id) ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <button class="details-btn" onclick="viewBusinessDetails(${business.id})">View Details</button>
        </div>
    `;
    return div;
}

function toggleFavorite(businessId) {
    const index = userFavorites.indexOf(businessId);
    if (index > -1) {
        userFavorites.splice(index, 1);
        showNotification('Removed from favorites', 'success');
    } else {
        userFavorites.push(businessId);
        showNotification('Added to favorites', 'success');
    }
    
    localStorage.setItem('userFavorites', JSON.stringify(userFavorites));
    
    // Refresh business list to update heart icons
    loadBusinessList();
}

function viewBusinessDetails(businessId) {
    const business = businesses.find(b => b.id === businessId);
    if (!business) return;

    // Add to recently viewed
    addToRecentlyViewed(business);
    
    // Show business details modal
    const modal = document.getElementById('business-modal');
    if (modal) {
        document.getElementById('modal-business-name').textContent = business.name;
        modal.classList.add('show');
    }
}

function addToRecentlyViewed(business) {
    // Remove if already exists
    recentlyViewed = recentlyViewed.filter(item => item.id !== business.id);
    
    // Add to beginning of array
    recentlyViewed.unshift({
        id: business.id,
        name: business.name,
        rating: business.rating,
        viewedAgo: 'Just now'
    });
    
    // Keep only last 10 items
    if (recentlyViewed.length > 10) {
        recentlyViewed = recentlyViewed.slice(0, 10);
    }
    
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
}

function applyFilters() {
    const priceFilter = document.getElementById('price-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    const ratingFilter = document.getElementById('rating-filter').value;

    let filtered = businesses.map(business => ({
        ...business,
        distance: calculateDistance(userLocation.lat, userLocation.lng, business.lat, business.lng)
    })).filter(business => business.distance < 10);

    // Apply price filter
    if (priceFilter) {
        filtered = filtered.filter(business => business.price === priceFilter);
    }

    // Apply category filter
    if (categoryFilter) {
        filtered = filtered.filter(business => business.category === categoryFilter);
    }

    // Apply rating filter
    if (ratingFilter) {
        filtered = filtered.filter(business => business.rating >= parseFloat(ratingFilter));
    }

    filteredBusinesses = filtered;
    displayBusinessList(filteredBusinesses);

    // Hide filter dropdown
    document.getElementById('filter-dropdown').classList.remove('show');
    showNotification(`Found ${filtered.length} businesses matching your criteria`, 'success');
}

// Search functionality
function initializeSearch() {
    const searchInputs = document.querySelectorAll('input[type="text"]');
    
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            if (searchTerm.length > 2) {
                performSearch(searchTerm);
            }
        });
    });
}

function performSearch(searchTerm) {
    const searchResults = businesses.filter(business => 
        business.name.toLowerCase().includes(searchTerm) ||
        business.category.toLowerCase().includes(searchTerm) ||
        business.description.toLowerCase().includes(searchTerm)
    );

    if (document.getElementById('map.html')) {
        filteredBusinesses = searchResults.map(business => ({
            ...business,
            distance: calculateDistance(userLocation.lat, userLocation.lng, business.lat, business.lng)
        })).filter(business => business.distance < 10);
        
        displayBusinessList(filteredBusinesses);
    }

    showNotification(`Found ${searchResults.length} results for "${searchTerm}"`, 'info');
}

// Interactive elements
function initializeInteractiveElements() {
    // Handle view toggle in business list
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            switchView(view);
        });
    });

    // Handle modal close buttons
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    });

    // Handle modal clicks outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
}

function switchView(view) {
    document.querySelectorAll('.view-btn').forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-view') === view);
    });

    document.getElementById('business-list')?.classList.toggle('grid-view', view === 'grid');
}

// Mock data
function loadMockBusinessData() {
    businesses = [
        {
            id: 1,
            name: "Taco Paradise",
            category: "Food",
            price: "$$",
            rating: 4.5,
            description: "Authentic Mexican tacos with fresh ingredients",
            lat: 30.2672,
            lng: -97.7431,
            image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
            hours: "9:00 AM - 9:00 PM",
            parking: "Street parking available",
            menu: ["Taco Plate - $12", "Burrito - $10", "Quesadilla - $8"]
        },
        {
            id: 2,
            name: "Artisan Coffee Co.",
            category: "Food",
            price: "$",
            rating: 4.8,
            description: "Locally roasted coffee and cozy atmosphere",
            lat: 30.2682,
            lng: -97.7441,
            image: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&h=300&fit=crop",
            hours: "7:00 AM - 6:00 PM",
            parking: "Parking lot available",
            menu: ["Espresso - $3", "Latte - $5", "Croissant - $4"]
        },
        {
            id: 3,
            name: "Local Bookstore",
            category: "Retail",
            price: "$",
            rating: 4.2,
            description: "Independent bookstore with curated selection",
            lat: 30.2662,
            lng: -97.7421,
            image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop",
            hours: "10:00 AM - 8:00 PM",
            parking: "Street parking",
            menu: []
        },
        {
            id: 4,
            name: "Community Garden",
            category: "Attractions",
            price: "Free",
            rating: 4.7,
            description: "Beautiful community garden and outdoor space",
            lat: 30.2692,
            lng: -97.7451,
            image: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=300&fit=crop",
            hours: "6:00 AM - 8:00 PM",
            parking: "Small parking lot",
            menu: []
        },
        {
            id: 5,
            name: "Boutique Style",
            category: "Retail",
            price: "$$$",
            rating: 4.3,
            description: "Fashion boutique with unique clothing and accessories",
            lat: 30.2652,
            lng: -97.7461,
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
            hours: "11:00 AM - 7:00 PM",
            parking: "Validation parking",
            menu: []
        },
        {
            id: 6,
            name: "Food Truck Fiesta",
            category: "Food",
            price: "$",
            rating: 4.6,
            description: "Authentic Mexican street food from a local food truck",
            lat: 30.2702,
            lng: -97.7411,
            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
            hours: "11:00 AM - 3:00 PM",
            parking: "Street parking",
            menu: ["Tacos - $3", "Burritos - $6", "Quesadillas - $5"]
        }
    ];

    // Load user data if available
    loadUserData();
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        background: #28a745;
    }
    
    .notification-error {
        background: #dc3545;
    }
    
    .notification-info {
        background: #17a2b8;
    }
`;
document.head.appendChild(notificationStyles);