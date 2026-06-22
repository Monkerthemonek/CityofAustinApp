(function () {
    'use strict';

    const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR0jl438oFGXjpUeNWNCxHUwwVtmt9GM5jEj6DteIq-VUQYgyWwH3m-_CuJN_TKagZ62vgSfT5JGOus/pub?output=csv';
    const DEFAULT_CENTER = [30.2672, -97.7431];
    const SCORE_FIELDS = ['taste', 'priceScore', 'setting', 'customerService', 'waitTime'];

    let map = null;
    let markers = [];
    let locations = [];

    // Prevent the old demo map from loading fake locations.
    if (typeof window.initializeMap === 'function') window.initializeMap = function () {};
    if (typeof window.loadMockBusinessData === 'function') window.loadMockBusinessData = function () {};

    document.addEventListener('DOMContentLoaded', initializeSheetMap);

    async function initializeSheetMap() {
        if (!document.getElementById('map')) return;

        connectFilters();

        if (!window.L) {
            showMapMessage('The map library did not load. Check the Leaflet links in map.html.');
            return;
        }

        createMap();

        if (!GOOGLE_SHEET_CSV_URL || GOOGLE_SHEET_CSV_URL.includes('PASTE_YOUR')) {
            renderLocations([]);
            showMapMessage('Paste the published Google Sheet CSV link into sheet-map.js.');
            return;
        }

        try {
            const response = await fetch(GOOGLE_SHEET_CSV_URL, { cache: 'no-store' });
            if (!response.ok) throw new Error(`Google Sheet request failed (${response.status})`);

            locations = parseLocations(await response.text());
            renderLocations(locations);

            if (!locations.length) {
                showMapMessage('No complete locations were found. Check the coordinates and all five scores.');
            }
        } catch (error) {
            console.error('Could not load locations:', error);
            renderLocations([]);
            showMapMessage('The spreadsheet could not be loaded. Publish the correct tab as CSV and check its link.');
        }
    }

    function createMap() {
        const mapElement = document.getElementById('map');
        mapElement.innerHTML = '';

        map = L.map(mapElement).setView(DEFAULT_CENTER, 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }

    function parseLocations(csvText) {
        const rows = parseCsvRows(csvText);
        if (rows.length < 2) return [];

        const headers = rows.shift().map(normalizeHeader);

        return rows.map((row, index) => {
            const record = {};
            headers.forEach((header, columnIndex) => {
                record[header] = String(row[columnIndex] || '').trim();
            });

            const location = {
                id: index + 1,
                name: getValue(record, 'name', 'business_name', 'location'),
                category: getValue(record, 'category', 'type'),
                price: getValue(record, 'price', 'price_range'),
                description: getValue(record, 'description', 'notes'),
                taste: parseScore(getValue(record, 'taste')),
                priceScore: parseScore(getValue(record, 'price_score', 'price_rating')),
                setting: parseScore(getValue(record, 'setting', 'atmosphere')),
                customerService: parseScore(getValue(record, 'customer_service', 'service')),
                waitTime: parseScore(getValue(record, 'wait_time', 'wait')),
                lat: Number(getValue(record, 'latitude', 'lat')),
                lng: Number(getValue(record, 'longitude', 'lng', 'lon')),
                address: getValue(record, 'address'),
                website: safeWebsite(getValue(record, 'website', 'url'))
            };

            location.rating = averageScores(location);
            return location;
        }).filter(isCompleteLocation);
    }

    function isCompleteLocation(location) {
        return Boolean(location.name)
            && Number.isFinite(location.lat)
            && Number.isFinite(location.lng)
            && SCORE_FIELDS.every(field => Number.isFinite(location[field]));
    }

    function parseScore(value) {
        const score = Number(value);
        return Number.isFinite(score) && score >= 1 && score <= 5 ? score : NaN;
    }

    function averageScores(location) {
        const scores = SCORE_FIELDS.map(field => location[field]);
        if (scores.some(score => !Number.isFinite(score))) return NaN;
        return Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 10) / 10;
    }

    function renderLocations(filteredLocations) {
        renderMarkers(filteredLocations);
        renderLocationList(filteredLocations);
    }

    function renderMarkers(filteredLocations) {
        if (!map) return;

        markers.forEach(marker => marker.remove());
        markers = [];

        if (!filteredLocations.length) {
            map.setView(DEFAULT_CENTER, 12);
            return;
        }

        const bounds = L.latLngBounds();
        filteredLocations.forEach(location => {
            const marker = L.marker([location.lat, location.lng])
                .addTo(map)
                .bindPopup(buildPopup(location));

            markers.push(marker);
            bounds.extend([location.lat, location.lng]);
        });

        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        window.setTimeout(() => map.invalidateSize(), 100);
    }

    function renderLocationList(filteredLocations) {
        const list = document.querySelector('.business-list, #business-list, .businesses-list');
        if (!list) return;

        list.innerHTML = '';

        if (!filteredLocations.length) {
            list.innerHTML = '<div class="sheet-empty-state">No locations match these filters.</div>';
            return;
        }

        filteredLocations.forEach(location => {
            const item = document.createElement('article');
            item.className = 'business-item sheet-business-item';
            item.innerHTML = `
                <div class="sheet-business-heading">
                    <h3>${escapeHtml(location.name)}</h3>
                    <strong class="sheet-rating">&#9733; ${location.rating.toFixed(1)}/5</strong>
                </div>
                <p>${escapeHtml([location.category, location.price].filter(Boolean).join(' | '))}</p>
                <div class="score-grid">${scoreBreakdown(location)}</div>
                ${location.address ? `<p>${escapeHtml(location.address)}</p>` : ''}
                ${location.description ? `<p>${escapeHtml(location.description)}</p>` : ''}
            `;

            item.addEventListener('click', () => {
                map.setView([location.lat, location.lng], 16);
                const marker = markers.find(candidate => candidate.getLatLng().equals([location.lat, location.lng]));
                if (marker) marker.openPopup();
            });

            list.appendChild(item);
        });
    }

    function buildPopup(location) {
        const website = location.website
            ? `<p><a href="${escapeHtml(location.website)}" target="_blank" rel="noopener noreferrer">Visit website</a></p>`
            : '';

        return `
            <div class="sheet-popup">
                <strong>${escapeHtml(location.name)}</strong>
                <div class="sheet-popup-rating">&#9733; ${location.rating.toFixed(1)}/5</div>
                <div class="score-grid">${scoreBreakdown(location)}</div>
                ${location.address ? `<p>${escapeHtml(location.address)}</p>` : ''}
                ${website}
            </div>
        `;
    }

    function scoreBreakdown(location) {
        return [
            ['Taste', location.taste],
            ['Price', location.priceScore],
            ['Setting', location.setting],
            ['Service', location.customerService],
            ['Wait time', location.waitTime]
        ].map(([label, score]) => `
            <span><b>${label}</b> ${formatScore(score)}</span>
        `).join('');
    }

    function connectFilters() {
        const applyButton = document.getElementById('apply-filters');
        if (!applyButton) return;

        applyButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopImmediatePropagation();
            applyFilters();
        }, true);
    }

    function applyFilters() {
        const price = normalizePriceFilter(document.getElementById('price-filter')?.value || '');
        const category = document.getElementById('category-filter')?.value.trim().toLowerCase() || '';
        const minimumRating = Number(document.getElementById('rating-filter')?.value || 0);

        const filtered = locations.filter(location => {
            const matchesPrice = !price || location.price === price;
            const matchesCategory = !category || location.category.toLowerCase() === category;
            const matchesRating = !minimumRating || location.rating >= minimumRating;
            return matchesPrice && matchesCategory && matchesRating;
        });

        renderLocations(filtered);
        document.getElementById('filter-dropdown')?.classList.remove('show');
    }

    function showMapMessage(message) {
        if (!map) return;

        L.popup({ closeButton: false, closeOnClick: false, autoClose: false })
            .setLatLng(DEFAULT_CENTER)
            .setContent(`<div class="sheet-map-message">${escapeHtml(message)}</div>`)
            .openOn(map);
    }

    function getValue(record, ...keys) {
        for (const key of keys) {
            if (record[key] !== undefined && record[key] !== '') return record[key];
        }
        return '';
    }

    function normalizeHeader(header) {
        return String(header).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    }

    function normalizePriceFilter(value) {
        const cleanValue = String(value).trim();
        return ({ '1': '$', '2': '$$', '3': '$$$', '4': '$$$$' })[cleanValue] || cleanValue;
    }

    function parseCsvRows(csvText) {
        const rows = [];
        let row = [];
        let value = '';
        let quoted = false;

        for (let index = 0; index < csvText.length; index += 1) {
            const character = csvText[index];
            const nextCharacter = csvText[index + 1];

            if (character === '"' && quoted && nextCharacter === '"') {
                value += '"';
                index += 1;
            } else if (character === '"') {
                quoted = !quoted;
            } else if (character === ',' && !quoted) {
                row.push(value);
                value = '';
            } else if ((character === '\n' || character === '\r') && !quoted) {
                if (value || row.length) {
                    row.push(value);
                    rows.push(row);
                    row = [];
                    value = '';
                }
                if (character === '\r' && nextCharacter === '\n') index += 1;
            } else {
                value += character;
            }
        }

        if (value || row.length) {
            row.push(value);
            rows.push(row);
        }

        return rows;
    }

    function safeWebsite(value) {
        if (!value) return '';
        try {
            const url = new URL(value);
            return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
        } catch {
            return '';
        }
    }

    function formatScore(score) {
        return Number.isInteger(score) ? `${score}/5` : `${score.toFixed(1)}/5`;
    }

    function escapeHtml(value) {
        const element = document.createElement('div');
        element.textContent = String(value || '');
        return element.innerHTML;
    }

    const styles = document.createElement('style');
    styles.textContent = `
        #map { min-height: 420px; background: #eef1f4; }
        .sheet-map-message { max-width: 260px; text-align: center; line-height: 1.4; }
        .sheet-empty-state { padding: 32px 20px; color: #666; text-align: center; }
        .sheet-business-item { cursor: pointer; }
        .sheet-business-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .sheet-business-heading h3 { margin: 0; }
        .sheet-rating, .sheet-popup-rating { color: #b45309; white-space: nowrap; }
        .score-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px 12px; margin: 10px 0; font-size: 0.85rem; }
        .score-grid span { display: flex; justify-content: space-between; gap: 8px; }
        .sheet-popup { min-width: 220px; }
        .sheet-popup p { margin: 8px 0 0; }
        @media (max-width: 560px) { .score-grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(styles);
}());
