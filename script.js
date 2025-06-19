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
const geoBtn = document.getElementById('geo-btn');
const unitToggle = document.getElementById('unit-toggle');
const themeToggle = document.getElementById('theme-toggle');
const errorMessage = document.getElementById('error-message');
const loadingSpinner = document.getElementById('loading-spinner');
const clearBtn = document.getElementById('clear-btn');

let currentUnit = 'C';
let lastWeatherData = null;
let lastCityName = '';
let lastCountry = '';

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    getWeatherByCity();
});

geoBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            await getWeatherByCoords(latitude, longitude);
            hideLoading();
        }, (err) => {
            showError('Could not get your location.');
            hideLoading();
        });
    } else {
        showError('Geolocation is not supported.');
    }
});

unitToggle.addEventListener('click', () => {
    currentUnit = currentUnit === 'C' ? 'F' : 'C';
    unitToggle.classList.toggle('active');
    if (lastWeatherData) {
        updateWeatherUI(lastWeatherData, lastCityName, lastCountry);
    }
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.classList.toggle('active');
    themeToggle.innerHTML = document.body.classList.contains('dark-mode') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// Autofocus input on load
window.addEventListener('DOMContentLoaded', () => {
    cityInput.focus();
    // Load last searched city from localStorage
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        cityInput.value = lastCity;
        getWeatherByCity(lastCity);
    }
});

// Show/hide clear button
cityInput.addEventListener('input', () => {
    clearBtn.style.display = cityInput.value ? 'inline-block' : 'none';
});
clearBtn.addEventListener('click', () => {
    cityInput.value = '';
    clearBtn.style.display = 'none';
    cityInput.focus();
});

function showLoading() {
    loadingSpinner.style.display = 'flex';
}
function hideLoading() {
    loadingSpinner.style.display = 'none';
}
function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
    setTimeout(() => { errorMessage.style.display = 'none'; }, 3500);
}

async function getWeatherByCity(cityOverride) {
    const city = cityOverride !== undefined ? cityOverride : cityInput.value.trim();
    if (!city || !/^[a-zA-Z\s]+$/.test(city)) {
        showError('Please enter a valid city name.');
        return;
    }
    showLoading();
    try {
        const geoRes = await fetch(`${BASE_URL}?name=${encodeURIComponent(city)}&count=1`);
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
            showError('City not found.');
            hideLoading();
            return;
        }
        const { latitude, longitude, name, country } = geoData.results[0];
        localStorage.setItem('lastCity', name); // Save last searched city
        await getWeatherByCoords(latitude, longitude, name, country);
    } catch (error) {
        showError('Error fetching weather data.');
    }
    hideLoading();
}
async function getWeatherByCoords(latitude, longitude, name, country) {
    try {
        const weatherRes = await fetch(`${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,pressure_msl,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset&timezone=auto`);
        const weatherData = await weatherRes.json();
        lastWeatherData = weatherData;
        lastCityName = name || 'Your Location';
        lastCountry = country || '';
        updateWeatherUI(weatherData, lastCityName, lastCountry);
    } catch (error) {
        showError('Error fetching weather data.');
    }
}


function updateWeatherUI(data, cityName, country) {
    document.getElementById('weather-info').style.display = 'block';
    cityNameEl.textContent = `${cityName}${country ? ', ' + country : ''}`;
    dateTime.textContent = new Date().toLocaleString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const current = data.current;
    let temp = current.temperature_2m;
    if (currentUnit === 'F') temp = temp * 9/5 + 32;
    temperature.textContent = Math.round(temp);
    temperature.nextSibling.textContent = `°${currentUnit}`;
    windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
    pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
    updateWeatherIcon(current.weather_code);
    updateForecast(data.daily);
    updateBackground(current.weather_code);
    // Show sunrise/sunset if available
    showSunTimes(data);
}

function updateForecast(daily) {
    forecastContainer.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const date = new Date(daily.time[i]).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
        let max = daily.temperature_2m_max[i];
        let min = daily.temperature_2m_min[i];
        if (currentUnit === 'F') {
            max = max * 9/5 + 32;
            min = min * 9/5 + 32;
        }
        const icon = getWeatherIconClass(daily.weather_code[i]);
        forecastContainer.innerHTML += `
            <div class="forecast-day">
                <div>${date}</div>
                <i class="fas ${icon}"></i>
                <div class="forecast-temp">${Math.round(max)}° / ${Math.round(min)}°${currentUnit}</div>
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

function updateBackground(code) {
    document.body.classList.remove('sunny', 'rainy', 'cloudy', 'snowy', 'stormy');
    if (code >= 0 && code <= 3) document.body.classList.add('sunny');
    else if (code >= 45 && code <= 48) document.body.classList.add('cloudy');
    else if (code >= 51 && code <= 67) document.body.classList.add('rainy');
    else if (code >= 71 && code <= 77) document.body.classList.add('snowy');
    else if (code >= 80 && code <= 86) document.body.classList.add('rainy');
    else if (code >= 95 && code <= 99) document.body.classList.add('stormy');
    else document.body.classList.add('sunny');
}

function showSunTimes(data) {
    let sunDiv = document.getElementById('sun-times');
    if (!sunDiv) {
        sunDiv = document.createElement('div');
        sunDiv.id = 'sun-times';
        sunDiv.style.textAlign = 'center';
        sunDiv.style.margin = '10px 0 0 0';
        document.querySelector('.weather-card').appendChild(sunDiv);
    }
    if (data.current && data.current.sunrise && data.current.sunset) {
        const sunrise = new Date(data.current.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const sunset = new Date(data.current.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sunDiv.innerHTML = `<span aria-label="Sunrise"><i class='fas fa-sun'></i> Sunrise: ${sunrise}</span> &nbsp; <span aria-label="Sunset"><i class='fas fa-moon'></i> Sunset: ${sunset}</span>`;
    } else if (data.daily && data.daily.sunrise && data.daily.sunset) {
        const sunrise = new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const sunset = new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sunDiv.innerHTML = `<span aria-label="Sunrise"><i class='fas fa-sun'></i> Sunrise: ${sunrise}</span> &nbsp; <span aria-label="Sunset"><i class='fas fa-moon'></i> Sunset: ${sunset}</span>`;
    } else {
        sunDiv.innerHTML = '';
    }
}
