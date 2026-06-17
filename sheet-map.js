                row = [];
                value = '';
            }
            if (char === '\r' && nextChar === '\n') i += 1;
        } else {
            value += char;
        }
    }

    if (value || row.length) {
        row.push(value);
        rows.push(row);
    }

    return rows;
}

function normalizeHeader(header) {
    return header.trim().toLowerCase().replace(/\s+/g, '_');
}

function normalizeCategory(category) {
    const cleanCategory = String(category || '').trim();
    if (!cleanCategory) return '';
    return cleanCategory.charAt(0).toUpperCase() + cleanCategory.slice(1).toLowerCase();
}

function renderSheetMap(locations) {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    if (!sheetMap) {
        mapElement.innerHTML = '';
        sheetMap = L.map('map').setView(DEFAULT_CENTER, 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(sheetMap);
    }

    sheetMarkers.forEach(marker => marker.remove());
    sheetMarkers = [];

    if (!locations.length) {
        sheetMap.setView(DEFAULT_CENTER, 13);
        return;
    }

    const bounds = L.latLngBounds();

    locations.forEach(location => {
        const marker = L.marker([location.lat, location.lng])
            .addTo(sheetMap)
            .bindPopup(buildPopupHtml(location));

        sheetMarkers.push(marker);
        bounds.extend([location.lat, location.lng]);
    });

    sheetMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });

    setTimeout(() => sheetMap.invalidateSize(), 100);
}

function buildPopupHtml(location) {
    const websiteLink = location.website
        ? `<br><a href="${location.website}" target="_blank" rel="noopener">Website</a>`
        : '';

    return `
        <strong>${location.name}</strong><br>
        ${location.category || 'Uncategorized'} | ${location.price || 'Price not listed'}<br>
        ${location.rating ? `${location.rating} stars<br>` : ''}
        ${location.address || location.description || ''}
        ${websiteLink}
    `;
}

function stopOldFilterHandler() {
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (!applyFiltersBtn) return;

    applyFiltersBtn.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        applySheetFilters();
    }, true);
}

function applySheetFilters() {
    const priceFilter = document.getElementById('price-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    const ratingFilter = document.getElementById('rating-filter').value;

    filteredBusinesses = businesses.filter(business => {
        const matchesPrice = !priceFilter || business.price === priceFilter;
        const matchesCategory = !categoryFilter || business.category.toLowerCase() === categoryFilter;
        const matchesRating = !ratingFilter || business.rating >= Number(ratingFilter);

        return matchesPrice && matchesCategory && matchesRating;
    });

    displayBusinessList(filteredBusinesses);
    renderSheetMap(filteredBusinesses);

    const dropdown = document.getElementById('filter-dropdown');
    if (dropdown) dropdown.classList.remove('show');
}

function showSheetMapMessage(message) {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    mapElement.innerHTML = `
        <div class="sheet-map-message">
            <i class="fas fa-map-marked-alt"></i>
            <p>${message}</p>
        </div>
    `;
}

const sheetMapStyles = document.createElement('style');
sheetMapStyles.textContent = `
    #map {
        min-height: 420px;
        background: #eef1f4;
    }

    .sheet-map-message {
        height: 100%;
        min-height: 420px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        color: #555;
        text-align: center;
        padding: 24px;
    }

    .sheet-map-message i {
        color: #667eea;
        font-size: 3rem;
    }
`;
document.head.appendChild(sheetMapStyles);
