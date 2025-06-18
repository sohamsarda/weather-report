const BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

const cityInput = document.getElementById('city-input');
const searchForm = document.getElementById('search-form');
const cityNameEl = document.getElementById('city-name');
const dateTime = document.getElementById('date-time');
const temperature = document.getElementById('temperature');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');
const pressure = document.getElementById('pressure');
const weatherIcon = document.querySelector('.weather-icon i');
const forecastContainer = document.getElementById('forecast-container');

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    getWeather();
});

async function getWeather() {
    const city = cityInput.value.trim();
    if (!city || !/^[a-zA-Z\s]+$/.test(city)) {
        alert('Please enter a valid Indian city name.');
        return;
    }

    try {
        const geoRes = await fetch(`${BASE_URL}?name=${city}&country=India&count=1`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            alert('City not found.');
            return;
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        const weatherRes = await fetch(`${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,pressure_msl,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`);
        const weatherData = await weatherRes.json();

        updateWeatherUI(weatherData, name, country);
    } catch (error) {
        console.error('Error fetching weather:', error);
        alert('Error fetching weather data.');
    }
}

function updateWeatherUI(data, cityName, country) {
    document.getElementById('weather-info').style.display = 'block';
    cityNameEl.textContent = `${cityName}, ${country}`;
    dateTime.textContent = new Date().toLocaleString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const current = data.current;
    temperature.textContent = Math.round(current.temperature_2m);
    windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
    pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;

    updateWeatherIcon(current.weather_code);

    updateForecast(data.daily);
}

function updateForecast(daily) {
    forecastContainer.innerHTML = '';

    for (let i = 0; i < 3; i++) {
        const date = new Date(daily.time[i]).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });

        const max = Math.round(daily.temperature_2m_max[i]);
        const min = Math.round(daily.temperature_2m_min[i]);
        const icon = getWeatherIconClass(daily.weather_code[i]);

        forecastContainer.innerHTML += `
            <div class="forecast-day">
                <div>${date}</div>
                <i class="fas ${icon}"></i>
                <div class="forecast-temp">${max}° / ${min}°C</div>
            </div>
        `;
    }
}

function updateWeatherIcon(code) {
    const iconClass = getWeatherIconClass(code);
    weatherIcon.className = `fas ${iconClass}`;
}

function getWeatherIconClass(code) {
    if (code >= 0 && code <= 3) return 'fa-sun';
    if (code >= 45 && code <= 48) return 'fa-smog';
    if (code >= 51 && code <= 57) return 'fa-cloud-rain';
    if (code >= 61 && code <= 67) return 'fa-cloud-showers-heavy';
    if (code >= 71 && code <= 77) return 'fa-snowflake';
    if (code >= 80 && code <= 86) return 'fa-cloud-showers-heavy';
    if (code >= 95 && code <= 99) return 'fa-bolt';
    return 'fa-cloud-sun';
}
