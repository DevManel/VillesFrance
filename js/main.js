// Fonction pour récupérer les régions
async function fetchRegions() {
    const response = await fetch('https://geo.api.gouv.fr/regions');
    const regions = await response.json();

    const regionsSelect = document.getElementById('regions');
    regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region.code;
        option.textContent = region.nom;
        regionsSelect.appendChild(option);
    });
}

document.addEventListener('DOMContentLoaded', fetchRegions);

// Fonction pour récupérer les départements d'une région
async function fetchDepartements(regionCode) {
    const response = await fetch(`https://geo.api.gouv.fr/regions/${regionCode}/departements`);
    const departements = await response.json();

    const departementsSelect = document.getElementById('departements');
    departementsSelect.innerHTML = '<option value="">Sélectionner un département</option>'; // Clear current options

    departements.forEach(departement => {
        const option = document.createElement('option');
        option.value = departement.code;
        option.textContent = departement.nom;
        departementsSelect.appendChild(option);
    });
}

document.getElementById('regions').addEventListener('change', (event) => {
    const regionCode = event.target.value;
    if (regionCode) {
        fetchDepartements(regionCode);
    }
});

// Fonction pour récupérer et afficher les communes d'un département
async function fetchCommunes(departementCode) {
    const response = await fetch(`https://geo.api.gouv.fr/departements/${departementCode}/communes`);
    const communes = await response.json();

    const communesList = document.getElementById('communes-list').querySelector('ul');
    communesList.innerHTML = ''; // Clear current list

    communes.sort((a, b) => b.population - a.population); // Tri par population (de la plus grande à la plus petite)

    communes.forEach(commune => {
        const li = document.createElement('li');
        li.textContent = `${commune.nom} - Population : ${commune.population}`;
        communesList.appendChild(li);
    });
}

document.getElementById('show-communes').addEventListener('click', () => {
    const departementCode = document.getElementById('departements').value;
    if (departementCode) {
        fetchCommunes(departementCode);
    }
});

// Fonction de géolocalisation pour afficher la ville où se trouve l'utilisateur
async function fetchCityInfo(lat, lon) {
    const response = await fetch(`https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&fields=nom,population,surface`);
    const city = await response.json();
    if (city && city.length > 0) {
        const cityData = city[0];
        alert(`Vous êtes à ${cityData.nom}. Population : ${cityData.population}, Surface : ${cityData.surface} km².`);
    } else {
        alert('Ville non trouvée.');
    }
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchCityInfo(lat, lon);
        });
    } else {
        alert('La géolocalisation n\'est pas supportée par votre navigateur.');
    }
}

document.getElementById('get-location').addEventListener('click', getCurrentLocation);

// Fonction pour afficher le contour de la ville sur une carte avec Leaflet
let map; // Global variable for the map
function initMap(lat, lon) {
    // Initialize Leaflet map with default view
    if (!map) {
        map = L.map('map').setView([lat, lon], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    } else {
        // If map is already initialized, update its view
        map.setView([lat, lon], 12);
    }
}

// Fonction pour afficher le contour de la ville
async function showCityContour(lat, lon) {
    const response = await fetch(`https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&fields=contour`);
    const city = await response.json();
    if (city && city.length > 0) {
        const cityData = city[0];
        const contour = cityData.contour;

        // Clear any existing polygon (if any)
        if (map && map.hasLayer(polygon)) {
            map.removeLayer(polygon);
        }

        // Show city contour as a polygon
        const polygon = L.polygon(contour[0]).addTo(map);
        polygon.bindPopup("Contour de la ville");
    } else {
        alert("Le contour de la ville n'a pas pu être trouvé.");
    }
}

function getCityContour() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            initMap(lat, lon); // Initialize map if not already
            showCityContour(lat, lon);
        });
    }
}

document.getElementById('show-contour').addEventListener('click', getCityContour);
