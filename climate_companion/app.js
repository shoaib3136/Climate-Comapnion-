// Replace with your own Google Maps API key and OpenWeatherMap API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyDCxYKcKnfCeR_v6ln9mPQiBcwGJHf7viI';
const OPENWEATHERMAP_API_KEY = '2e110a9a03af8f5cf2208d149045bd01';

let map;
let directionsService;
let directionsRenderer;
let currentPosition = { lat: 0, lon: 0 }; // Default coordinates

// Function to initialize the map
function initMap() {
    // Initialize Google Maps services
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    // Create a map centered on default location
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 7,
        center: { lat: 20.5937, lng: 78.9629 } // Default center (India)
    });
    directionsRenderer.setMap(map);

    // Get the user's current location using Geolocation API
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentPosition = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                // Set the map center to the user's current location
                map.setCenter({ lat: currentPosition.lat, lng: currentPosition.lon });
                document.getElementById("current-location").textContent = `Current Location: (${currentPosition.lat}, ${currentPosition.lon})`;
            },
            (error) => {
                alert("Geolocation failed: " + error.message);
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Function to calculate the route and monitor weather
async function calculateRouteAndMonitorWeather(destinationCity) {
    // Geocode the destination city to get coordinates
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: destinationCity }, (results, status) => {
        if (status === "OK") {
            const destination = results[0].geometry.location;

            // Define the route request
            const request = {
                origin: new google.maps.LatLng(currentPosition.lat, currentPosition.lon),
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING,
            };

            // Request the route and display it
            directionsService.route(request, async function (result, status) {
                if (status == 'OK') {
                    directionsRenderer.setDirections(result);
                    
                    const route = result.routes[0];
                    const citiesAlongRoute = extractCitiesFromRoute(route);

                    // Fetch weather along the route and check for bad weather
                    const weatherData = await fetchWeatherForRoute(citiesAlongRoute);
                    const badWeatherDetected = checkForBadWeather(weatherData);
                    
                    if (badWeatherDetected) {
                        alert("Bad weather detected on the current route. Rerouting...");
                        rerouteUserToAvoidBadWeather(route);
                    }
                } else {
                    alert("Could not calculate route: " + status);
                }
            });
        } else {
            alert("Could not find the destination: " + status);
        }
    });
}

// Function to extract cities from the route
function extractCitiesFromRoute(route) {
    const cities = [];
    const steps = route.legs[0].steps;
    steps.forEach(step => {
        if (step.end_location) {
            cities.push({
                lat: step.end_location.lat(),
                lon: step.end_location.lng()
            });
        }
    });
    return cities;
}

// Function to fetch weather data for cities along the route
async function fetchWeatherForRoute(cities) {
    const weatherData = [];
    for (let i = 0; i < cities.length; i++) {
        const city = cities[i];
        const weather = await fetchWeatherData(city.lat, city.lon);
        weatherData.push({ city: city, weather: weather });
    }
    return weatherData;
}

// Function to fetch weather data using OpenWeatherMap API
async function fetchWeatherData(lat, lon) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}`;
    const response = await fetch(weatherUrl);
    const data = await response.json();
    return data;
}

// Function to check if there is bad weather along the route
function checkForBadWeather(weatherData) {
    let badWeatherDetected = false;
    weatherData.forEach(data => {
        const weatherCondition = data.weather[0].main.toLowerCase();
        if (['rain', 'thunderstorm', 'snow'].includes(weatherCondition)) {
            badWeatherDetected = true;
        }
    });
    return badWeatherDetected;
}

// Function to reroute user to avoid bad weather
function rerouteUserToAvoidBadWeather(route) {
    alert("Rerouting to avoid bad weather...");
    // Logic to reroute can go here.
}

// Handle the form submission to start routing
document.getElementById("route-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const destinationCity = document.getElementById("destination").value;
    if (destinationCity) {
        calculateRouteAndMonitorWeather(destinationCity);
    } else {
        alert("Please enter a destination city.");
    }
});
