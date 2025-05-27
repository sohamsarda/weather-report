// OpenMeteo API configuration
const BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const cityName = document.getElementById('city-name');
const dateTime = document.getElementById('date-time');
const temperature = document.getElementById('temperature');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');
const pressure = document.getElementById('pressure');
const weatherIcon = document.querySelector('.weather-icon i');

// Event Listeners
searchBtn.addEventListener('click', getWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getWeather();
    }
});

// Get weather data
async function getWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        alert('Please enter a city name');
        return;
    }

    try {
        // First, get coordinates for the city
        const geoResponse = await fetch(`${BASE_URL}?name=${city}&country=India&count=1`);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            alert('City not found. Please enter a valid Indian city name.');
            return;
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // Then, get weather data using coordinates
        const weatherResponse = await fetch(
            `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,pressure_msl,weather_code`
        );
        const weatherData = await weatherResponse.json();

        updateWeatherUI(weatherData, name, country);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Error fetching weather data. Please try again.');
    }
}

// Update UI with weather data
function updateWeatherUI(data, cityName, country) {
    // Update city name and date
    document.getElementById('city-name').textContent = `${cityName}, ${country}`;
    document.getElementById('date-time').textContent = new Date().toLocaleString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const current = data.current;

    // Update temperature
    temperature.textContent = Math.round(current.temperature_2m);

    // Update weather icon
    updateWeatherIcon(current.weather_code);

    // Update weather details
    windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
    pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
}

// Update weather icon based on weather condition
function updateWeatherIcon(code) {
    let iconClass = 'fa-cloud-sun';
    
    // WMO Weather interpretation codes (WW)
    // https://open-meteo.com/en/docs
    if (code >= 0 && code <= 3) {
        iconClass = 'fa-sun'; // Clear sky
    } else if (code >= 45 && code <= 48) {
        iconClass = 'fa-smog'; // Fog
    } else if (code >= 51 && code <= 55) {
        iconClass = 'fa-cloud-rain'; // Drizzle
    } else if (code >= 56 && code <= 57) {
        iconClass = 'fa-snowflake'; // Freezing drizzle
    } else if (code >= 61 && code <= 65) {
        iconClass = 'fa-cloud-showers-heavy'; // Rain
    } else if (code >= 66 && code <= 67) {
        iconClass = 'fa-snowflake'; // Freezing rain
    } else if (code >= 71 && code <= 77) {
        iconClass = 'fa-snowflake'; // Snow
    } else if (code >= 80 && code <= 82) {
        iconClass = 'fa-cloud-showers-heavy'; // Rain showers
    } else if (code >= 85 && code <= 86) {
        iconClass = 'fa-snowflake'; // Snow showers
    } else if (code >= 95 && code <= 99) {
        iconClass = 'fa-bolt'; // Thunderstorm
    }

    weatherIcon.className = `fas ${iconClass}`;
} 