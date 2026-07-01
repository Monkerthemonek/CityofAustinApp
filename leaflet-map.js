const AUSTIN_CENTER = [30.2672, -97.7431];

let localLensLeafletMap = null;
let localLensMarkers = [];

document.addEventListener('DOMContentLoaded', initializeLeafletMap);

function initializeLeafletMap() {
    if (!window.location.pathname.includes('map.html')) return;

    const mapElement = document.getElementById('map');
    if (!mapElement || !window.L) return;

    mapElement.innerHTML = '';

    const center = userLocation ? [userLocation.lat, userLocation.lng] : AUSTIN_CENTER;

    localLensLeafletMap = L.map('map').setView(center, 14);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(localLensLeafletMap);

    L.marker(center)
        .addTo(localLensLeafletMap)
        .bindPopup('Your location');

    renderBusinessMarkers();

    setTimeout(() => {
        localLensLeafletMap.invalidateSize();
    }, 150);
}

function renderBusinessMarkers() {
    if (!localLensLeafletMap || !Array.isArray(businesses)) return;

    localLensMarkers.forEach(marker => marker.remove());
    localLensMarkers = [];

    businesses.forEach(business => {
        if (typeof business.lat !== 'number' || typeof business.lng !== 'number') return;

        const marker = L.marker([business.lat, business.lng])
            .addTo(localLensLeafletMap)
            .bindPopup(`
                <strong>${business.name}</strong><br>
                ${business.category} | ${business.rating} stars<br>
                ${business.description}
            `);

        marker.on('click', () => {
            if (typeof viewBusinessDetails === 'function') {
                marker.openPopup();
            }
        });

        localLensMarkers.push(marker);
    });
}

const leafletMapStyles = document.createElement('style');
leafletMapStyles.textContent = `
    #map {
        min-height: 420px;
        background: #eef1f4;
    }

    .map-section,
    #map {
        z-index: 1;
    }

    .leaflet-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
`;
document.head.appendChild(leafletMapStyles);
