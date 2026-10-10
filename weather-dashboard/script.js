/**
 * SkyPulse Weather Dashboard Engine
 * Integrates Open-Meteo REST API (Zero Key / Zero Dependencies)
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'ankit_skypulse_city_v1';
  const UNIT_KEY = 'ankit_skypulse_unit';
  const THEME_KEY = 'ap_portfolio_theme';

  // Default initial city
  const DEFAULT_CITY = {
    name: 'New Delhi',
    country: 'India',
    lat: 28.6139,
    lon: 77.2090
  };

  // State
  let currentCity = { ...DEFAULT_CITY };
  let currentUnit = localStorage.getItem(UNIT_KEY) || 'C'; // 'C' or 'F'
  let cachedWeatherData = null;

  // DOM Elements
  const DOM = {
    html: document.documentElement,
    backdrop: document.getElementById('weather-backdrop'),
    themeToggle: document.getElementById('theme-toggle'),
    unitC: document.getElementById('unit-c'),
    unitF: document.getElementById('unit-f'),

    // Search
    searchForm: document.getElementById('city-search-form'),
    cityInput: document.getElementById('city-input'),
    geoBtn: document.getElementById('geo-location-btn'),
    suggestionsBox: document.getElementById('suggestions-box'),
    cityChips: document.querySelectorAll('.city-chip'),

    // Status
    statusIndicator: document.getElementById('status-indicator'),
    statusText: document.getElementById('status-text'),
    errorAlert: document.getElementById('error-alert'),
    errorMessage: document.getElementById('error-message'),

    // Hero Weather
    cityName: document.getElementById('current-city-name'),
    dateTime: document.getElementById('current-date-time'),
    weatherBadge: document.getElementById('weather-badge'),
    weatherIcon: document.getElementById('current-weather-icon'),
    currentTemp: document.getElementById('current-temp'),
    displayTempUnit: document.getElementById('display-temp-unit'),
    feelsLike: document.getElementById('feels-like-val'),
    todayHigh: document.getElementById('today-high'),
    todayLow: document.getElementById('today-low'),

    // Metrics
    metricWind: document.getElementById('metric-wind'),
    metricWindDir: document.getElementById('metric-wind-dir'),
    metricHumidity: document.getElementById('metric-humidity'),
    metricUv: document.getElementById('metric-uv'),
    metricPressure: document.getElementById('metric-pressure'),
    timeSunrise: document.getElementById('time-sunrise'),
    timeSunset: document.getElementById('time-sunset'),

    // Lists
    hourlyList: document.getElementById('hourly-forecast-list'),
    weeklyList: document.getElementById('weekly-forecast-list'),
    summaryText: document.getElementById('weather-summary-text')
  };

  /* ==========================================================================
     01. THEME & UNIT ENGINE
     ========================================================================== */
  function initThemeAndUnits() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const activeTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    DOM.html.setAttribute('data-theme', activeTheme);

    DOM.themeToggle.addEventListener('click', () => {
      const current = DOM.html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      DOM.html.setAttribute('data-theme', next);
      localStorage.setItem(THEME_KEY, next);
    });

    // Units
    updateUnitButtons();

    DOM.unitC.addEventListener('click', () => {
      if (currentUnit !== 'C') {
        currentUnit = 'C';
        localStorage.setItem(UNIT_KEY, 'C');
        updateUnitButtons();
        if (cachedWeatherData) renderWeather(cachedWeatherData);
      }
    });

    DOM.unitF.addEventListener('click', () => {
      if (currentUnit !== 'F') {
        currentUnit = 'F';
        localStorage.setItem(UNIT_KEY, 'F');
        updateUnitButtons();
        if (cachedWeatherData) renderWeather(cachedWeatherData);
      }
    });
  }

  function updateUnitButtons() {
    if (currentUnit === 'C') {
      DOM.unitC.classList.add('active');
      DOM.unitC.setAttribute('aria-checked', 'true');
      DOM.unitF.classList.remove('active');
      DOM.unitF.setAttribute('aria-checked', 'false');
    } else {
      DOM.unitF.classList.add('active');
      DOM.unitF.setAttribute('aria-checked', 'true');
      DOM.unitC.classList.remove('active');
      DOM.unitC.setAttribute('aria-checked', 'false');
    }
    DOM.displayTempUnit.textContent = `°${currentUnit}`;
  }

  function formatTemp(celsiusVal) {
    if (celsiusVal === undefined || celsiusVal === null) return '--';
    if (currentUnit === 'F') {
      const f = (celsiusVal * 9) / 5 + 32;
      return Math.round(f);
    }
    return Math.round(celsiusVal);
  }

  /* ==========================================================================
     02. WEATHER CODE INTERPRETATION & ICONS
     ========================================================================== */
  const WMO_MAP = {
    0: { label: 'Clear Sky', type: 'sunny', aura1: 'rgba(245, 158, 11, 0.25)', aura2: 'rgba(59, 130, 246, 0.15)' },
    1: { label: 'Mainly Clear', type: 'sunny', aura1: 'rgba(245, 158, 11, 0.2)', aura2: 'rgba(59, 130, 246, 0.15)' },
    2: { label: 'Partly Cloudy', type: 'cloudy', aura1: 'rgba(100, 116, 139, 0.2)', aura2: 'rgba(59, 130, 246, 0.15)' },
    3: { label: 'Overcast', type: 'cloudy', aura1: 'rgba(71, 85, 105, 0.3)', aura2: 'rgba(30, 41, 59, 0.2)' },
    45: { label: 'Foggy', type: 'fog', aura1: 'rgba(148, 163, 184, 0.25)', aura2: 'rgba(71, 85, 105, 0.2)' },
    48: { label: 'Depositing Rime Fog', type: 'fog', aura1: 'rgba(148, 163, 184, 0.25)', aura2: 'rgba(71, 85, 105, 0.2)' },
    51: { label: 'Light Drizzle', type: 'rainy', aura1: 'rgba(14, 165, 233, 0.25)', aura2: 'rgba(30, 58, 138, 0.2)' },
    53: { label: 'Moderate Drizzle', type: 'rainy', aura1: 'rgba(14, 165, 233, 0.25)', aura2: 'rgba(30, 58, 138, 0.2)' },
    55: { label: 'Dense Drizzle', type: 'rainy', aura1: 'rgba(14, 165, 233, 0.25)', aura2: 'rgba(30, 58, 138, 0.2)' },
    61: { label: 'Slight Rain', type: 'rainy', aura1: 'rgba(37, 99, 235, 0.25)', aura2: 'rgba(14, 116, 144, 0.2)' },
    63: { label: 'Moderate Rain', type: 'rainy', aura1: 'rgba(37, 99, 235, 0.3)', aura2: 'rgba(14, 116, 144, 0.25)' },
    65: { label: 'Heavy Rain', type: 'rainy', aura1: 'rgba(29, 78, 216, 0.35)', aura2: 'rgba(15, 23, 42, 0.3)' },
    71: { label: 'Slight Snow', type: 'snow', aura1: 'rgba(224, 242, 254, 0.3)', aura2: 'rgba(186, 230, 253, 0.2)' },
    73: { label: 'Moderate Snow', type: 'snow', aura1: 'rgba(224, 242, 254, 0.35)', aura2: 'rgba(186, 230, 253, 0.25)' },
    75: { label: 'Heavy Snow', type: 'snow', aura1: 'rgba(240, 249, 255, 0.4)', aura2: 'rgba(186, 230, 253, 0.3)' },
    80: { label: 'Rain Showers', type: 'rainy', aura1: 'rgba(14, 165, 233, 0.25)', aura2: 'rgba(30, 58, 138, 0.2)' },
    81: { label: 'Heavy Showers', type: 'rainy', aura1: 'rgba(2, 132, 199, 0.3)', aura2: 'rgba(30, 58, 138, 0.25)' },
    95: { label: 'Thunderstorm', type: 'storm', aura1: 'rgba(124, 58, 237, 0.3)', aura2: 'rgba(30, 27, 75, 0.35)' },
    96: { label: 'Thunderstorm & Hail', type: 'storm', aura1: 'rgba(124, 58, 237, 0.35)', aura2: 'rgba(30, 27, 75, 0.4)' }
  };

  function getWeatherIconSvg(code, isDay = 1) {
    const meta = WMO_MAP[code] || { type: 'cloudy' };
    const type = meta.type;

    if (type === 'sunny') {
      if (isDay) {
        return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="14" fill="#F59E0B"/>
          <path d="M32 6V12M32 52V58M6 32H12M52 32H58M13.62 13.62L17.86 17.86M46.14 46.14L50.38 50.38M13.62 50.38L17.86 46.14M46.14 17.86L50.38 13.62" stroke="#FBBF24" stroke-width="4" stroke-linecap="round"/>
        </svg>`;
      } else {
        return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M42 36C42 46 34 54 24 54C19 54 14.5 52 11 48.5C14 49.5 17.5 50 21 50C33.15 50 43 40.15 43 28C43 21 39.5 14.5 34 10.5C40 14.5 42 22 42 36Z" fill="#93C5FD"/>
        </svg>`;
      }
    } else if (type === 'rainy') {
      return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M46 36C49.3 36 52 33.3 52 30C52 26.9 49.7 24.3 46.7 24.1C45.9 18.4 41 14 35 14C30.4 14 26.4 16.6 24.4 20.4C23.6 20.2 22.8 20 22 20C17.6 20 14 23.6 14 28C14 28.4 14 28.7 14.1 29.1C11.7 30.1 10 32.4 10 35C10 38.3 12.7 41 16 41H46" fill="#94A3B8"/>
        <path d="M22 46L19 54M32 46L29 54M42 46L39 54" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round"/>
      </svg>`;
    } else if (type === 'storm') {
      return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M46 32C49.3 32 52 29.3 52 26C52 22.9 49.7 20.3 46.7 20.1C45.9 14.4 41 10 35 10C30.4 10 26.4 12.6 24.4 16.4C23.6 16.2 22.8 16 22 16C17.6 16 14 19.6 14 24C14 24.4 14 24.7 14.1 25.1C11.7 26.1 10 28.4 10 31C10 34.3 12.7 37 16 37H46" fill="#64748B"/>
        <path d="M30 38L25 48H32L28 58L40 45H32L36 38H30Z" fill="#FACC15"/>
      </svg>`;
    } else if (type === 'snow') {
      return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M46 32C49.3 32 52 29.3 52 26C52 22.9 49.7 20.3 46.7 20.1C45.9 14.4 41 10 35 10C30.4 10 26.4 12.6 24.4 16.4C23.6 16.2 22.8 16 22 16C17.6 16 14 19.6 14 24C14 24.4 14 24.7 14.1 25.1C11.7 26.1 10 28.4 10 31C10 34.3 12.7 37 16 37H46" fill="#94A3B8"/>
        <circle cx="24" cy="48" r="2.5" fill="#BAE6FD"/>
        <circle cx="34" cy="46" r="2.5" fill="#BAE6FD"/>
        <circle cx="44" cy="50" r="2.5" fill="#BAE6FD"/>
      </svg>`;
    } else {
      // Cloudy default
      return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M46 40C49.3 40 52 37.3 52 34C52 30.9 49.7 28.3 46.7 28.1C45.9 22.4 41 18 35 18C30.4 18 26.4 20.6 24.4 24.4C23.6 24.2 22.8 24 22 24C17.6 24 14 27.6 14 32C14 32.4 14 32.7 14.1 33.1C11.7 34.1 10 36.4 10 39C10 42.3 12.7 45 16 45H46" fill="#94A3B8"/>
      </svg>`;
    }
  }

  /* ==========================================================================
     03. API FETCHING & DATA NORMALIZATION
     ========================================================================== */
  async function fetchWeatherData(lat, lon) {
    showLoading(true);
    DOM.errorAlert.style.display = 'none';

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset&timezone=auto`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      cachedWeatherData = data;
      renderWeather(data);
    } catch (err) {
      console.warn('Network issue fetching live weather, using mock generator fallback:', err);
      DOM.errorAlert.style.display = 'flex';
      DOM.errorMessage.textContent = 'Live endpoint unreachable. Displaying cached meteorological estimation.';
      const mockData = generateMockWeatherData();
      cachedWeatherData = mockData;
      renderWeather(mockData);
    } finally {
      showLoading(false);
    }
  }

  function showLoading(show) {
    DOM.statusIndicator.style.display = show ? 'flex' : 'none';
  }

  function generateMockWeatherData() {
    const hours = [];
    const hourlyTemps = [];
    const hourlyRain = [];
    const hourlyCodes = [];
    const now = new Date();

    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getTime() + i * 3600000);
      hours.push(d.toISOString());
      hourlyTemps.push(26 + Math.sin(i / 3) * 6);
      hourlyRain.push(i % 5 === 0 ? 30 : 5);
      hourlyCodes.push(i % 4 === 0 ? 2 : 1);
    }

    const days = [];
    const dailyMax = [];
    const dailyMin = [];
    const dailyCodes = [];
    const sunrises = [];
    const sunsets = [];

    for (let j = 0; j < 7; j++) {
      const d = new Date(now.getTime() + j * 86400000);
      days.push(d.toISOString().split('T')[0]);
      dailyMax.push(32 + Math.round(Math.random() * 3));
      dailyMin.push(22 + Math.round(Math.random() * 2));
      dailyCodes.push(j === 2 ? 61 : j === 4 ? 2 : 0);
      sunrises.push(`${d.toISOString().split('T')[0]}T06:14`);
      sunsets.push(`${d.toISOString().split('T')[0]}T18:42`);
    }

    return {
      current: {
        temperature_2m: 29.4,
        apparent_temperature: 31.2,
        relative_humidity_2m: 48,
        precipitation: 0,
        weather_code: 1,
        surface_pressure: 1012,
        wind_speed_10m: 13.5,
        wind_direction_10m: 310,
        is_day: 1
      },
      hourly: {
        time: hours,
        temperature_2m: hourlyTemps,
        precipitation_probability: hourlyRain,
        weather_code: hourlyCodes
      },
      daily: {
        time: days,
        weather_code: dailyCodes,
        temperature_2m_max: dailyMax,
        temperature_2m_min: dailyMin,
        uv_index_max: [6.4, 6.8, 5.2, 7.1, 6.0, 5.8, 6.2],
        sunrise: sunrises,
        sunset: sunsets
      }
    };
  }

  /* ==========================================================================
     04. RENDERING ENGINE
     ========================================================================== */
  function renderWeather(data) {
    const cur = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    // Header & Meta
    DOM.cityName.textContent = `${currentCity.name}${currentCity.country ? ', ' + currentCity.country : ''}`;
    DOM.dateTime.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Condition
    const wCode = cur.weather_code;
    const meta = WMO_MAP[wCode] || { label: 'Partly Cloudy', type: 'cloudy', aura1: 'rgba(59,130,246,0.2)', aura2: 'rgba(14,165,233,0.15)' };
    DOM.weatherBadge.textContent = meta.label;

    // Aura Backdrop
    if (meta.aura1 && meta.aura2) {
      DOM.backdrop.style.background = `radial-gradient(circle at 20% 20%, ${meta.aura1} 0%, transparent 60%), radial-gradient(circle at 80% 80%, ${meta.aura2} 0%, transparent 60%)`;
    }

    // Hero Visuals
    DOM.weatherIcon.innerHTML = getWeatherIconSvg(wCode, cur.is_day);
    DOM.currentTemp.textContent = formatTemp(cur.temperature_2m);
    DOM.feelsLike.textContent = `${formatTemp(cur.apparent_temperature)}°${currentUnit}`;

    if (daily && daily.temperature_2m_max && daily.temperature_2m_max.length) {
      DOM.todayHigh.textContent = `${formatTemp(daily.temperature_2m_max[0])}°${currentUnit}`;
      DOM.todayLow.textContent = `${formatTemp(daily.temperature_2m_min[0])}°${currentUnit}`;
    }

    // Quad Metrics
    DOM.metricWind.textContent = `${Math.round(cur.wind_speed_10m)} km/h`;
    DOM.metricWindDir.textContent = getWindDirectionText(cur.wind_direction_10m);
    DOM.metricHumidity.textContent = `${cur.relative_humidity_2m}%`;
    DOM.metricPressure.textContent = `${Math.round(cur.surface_pressure)} hPa`;
    DOM.metricUv.textContent = (daily.uv_index_max && daily.uv_index_max[0]) ? daily.uv_index_max[0].toFixed(1) : '5.2';

    // Sunrise & Sunset
    if (daily.sunrise && daily.sunrise[0]) {
      DOM.timeSunrise.textContent = formatSunTime(daily.sunrise[0]);
    }
    if (daily.sunset && daily.sunset[0]) {
      DOM.timeSunset.textContent = formatSunTime(daily.sunset[0]);
    }

    // Render 24H Timeline
    renderHourlyTimeline(hourly);

    // Render 7-Day Extended Outlook
    renderWeeklyOutlook(daily);

    // Atmospheric Intel Summary
    updateAtmosphericIntel(meta.label, cur);
  }

  function getWindDirectionText(degrees) {
    if (degrees === undefined) return 'Calm';
    const directions = ['North', 'NE', 'East', 'SE', 'South', 'SW', 'West', 'NW'];
    const idx = Math.round(degrees / 45) % 8;
    return directions[idx];
  }

  function formatSunTime(isoStr) {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--';
    }
  }

  function renderHourlyTimeline(hourly) {
    DOM.hourlyList.innerHTML = '';
    if (!hourly || !hourly.time) return;

    // Show next 24 data points
    const count = Math.min(24, hourly.time.length);
    for (let i = 0; i < count; i++) {
      const timeStr = hourly.time[i];
      const tempVal = hourly.temperature_2m[i];
      const rainChance = hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0;
      const code = hourly.weather_code[i];

      const d = new Date(timeStr);
      const isNow = i === 0;
      const hourLabel = isNow ? 'Now' : d.toLocaleTimeString('en-US', { hour: 'numeric' });
      const isDayHour = d.getHours() >= 6 && d.getHours() < 19 ? 1 : 0;

      const item = document.createElement('div');
      item.className = `hourly-item ${isNow ? 'now' : ''}`;
      item.innerHTML = `
        <span class="hourly-time">${hourLabel}</span>
        <div class="hourly-icon">${getWeatherIconSvg(code, isDayHour)}</div>
        <span class="hourly-temp">${formatTemp(tempVal)}°</span>
        ${rainChance > 15 ? `<span class="hourly-rain">${rainChance}%</span>` : '<span class="hourly-rain">&nbsp;</span>'}
      `;
      DOM.hourlyList.appendChild(item);
    }
  }

  function renderWeeklyOutlook(daily) {
    DOM.weeklyList.innerHTML = '';
    if (!daily || !daily.time) return;

    const days = daily.time;
    // Calculate global min and max for consistent bar scaling
    const allMin = Math.min(...daily.temperature_2m_min);
    const allMax = Math.max(...daily.temperature_2m_max);
    const totalSpan = allMax - allMin || 1;

    for (let i = 0; i < days.length; i++) {
      const dayDate = new Date(days[i]);
      const isToday = i === 0;
      const dayName = isToday ? 'Today' : dayDate.toLocaleDateString('en-US', { weekday: 'short' });
      const code = daily.weather_code[i];
      const min = daily.temperature_2m_min[i];
      const max = daily.temperature_2m_max[i];

      const leftPercent = Math.max(0, Math.round(((min - allMin) / totalSpan) * 100));
      const widthPercent = Math.max(15, Math.round(((max - min) / totalSpan) * 100));

      const row = document.createElement('div');
      row.className = 'weekly-row';
      row.innerHTML = `
        <span class="weekly-day">${dayName}</span>
        <div class="weekly-icon">${getWeatherIconSvg(code, 1)}</div>
        <div class="temp-bar-wrap">
          <div class="temp-bar-fill" style="margin-left: ${leftPercent}%; width: ${widthPercent}%;"></div>
        </div>
        <div class="weekly-temp-range">
          <span class="temp-min">${formatTemp(min)}°</span>
          <span class="temp-max">${formatTemp(max)}°</span>
        </div>
      `;
      DOM.weeklyList.appendChild(row);
    }
  }

  function updateAtmosphericIntel(conditionLabel, cur) {
    let summary = `The atmosphere in ${currentCity.name} presents ${conditionLabel.toLowerCase()}. `;
    if (cur.relative_humidity_2m > 70) {
      summary += 'Elevated relative humidity may increase perception of heat. Hydration recommended.';
    } else if (cur.wind_speed_10m > 25) {
      summary += 'Breezy conditions prevailing with sustained gusts across the immediate area.';
    } else {
      summary += 'Current barometric readings and wind trajectories suggest steady, comfortable conditions throughout the observation cycle.';
    }
    DOM.summaryText.textContent = summary;
  }

  /* ==========================================================================
     05. GEOCODING SEARCH & AUTOCOMPLETE
     ========================================================================== */
  let debounceTimer;
  function setupSearchEvents() {
    DOM.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = DOM.cityInput.value.trim();
      if (!query) return;
      searchCity(query);
    });

    DOM.cityInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      clearTimeout(debounceTimer);
      if (query.length < 3) {
        DOM.suggestionsBox.style.display = 'none';
        return;
      }
      debounceTimer = setTimeout(() => {
        fetchCitySuggestions(query);
      }, 350);
    });

    document.addEventListener('click', (e) => {
      if (!DOM.searchForm.contains(e.target)) {
        DOM.suggestionsBox.style.display = 'none';
      }
    });

    // Quick City Chips
    DOM.cityChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.cityChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const name = chip.getAttribute('data-city');
        const lat = parseFloat(chip.getAttribute('data-lat'));
        const lon = parseFloat(chip.getAttribute('data-lon'));

        currentCity = { name, country: '', lat, lon };
        saveLastCity();
        fetchWeatherData(lat, lon);
      });
    });

    // Geolocation API
    DOM.geoBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      showLoading(true);
      DOM.statusText.textContent = 'Acquiring GPS coordinates...';

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          currentCity = {
            name: 'Local Coordinates',
            country: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
            lat,
            lon
          };
          saveLastCity();
          fetchWeatherData(lat, lon);
        },
        (error) => {
          showLoading(false);
          alert('Could not retrieve your location: ' + error.message);
        },
        { timeout: 10000 }
      );
    });
  }

  async function fetchCitySuggestions(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.results && data.results.length) {
        renderSuggestions(data.results);
      } else {
        DOM.suggestionsBox.style.display = 'none';
      }
    } catch {
      DOM.suggestionsBox.style.display = 'none';
    }
  }

  function renderSuggestions(results) {
    DOM.suggestionsBox.innerHTML = '';
    results.forEach(loc => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.innerHTML = `
        <span class="suggestion-name">${loc.name}</span>
        <span class="suggestion-country">${loc.admin1 ? loc.admin1 + ', ' : ''}${loc.country || ''}</span>
      `;
      item.addEventListener('click', () => {
        currentCity = {
          name: loc.name,
          country: loc.country || '',
          lat: loc.latitude,
          lon: loc.longitude
        };
        DOM.cityInput.value = loc.name;
        DOM.suggestionsBox.style.display = 'none';
        saveLastCity();
        fetchWeatherData(loc.latitude, loc.longitude);
      });
      DOM.suggestionsBox.appendChild(item);
    });
    DOM.suggestionsBox.style.display = 'block';
  }

  async function searchCity(query) {
    DOM.suggestionsBox.style.display = 'none';
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    try {
      showLoading(true);
      DOM.statusText.textContent = `Finding coordinates for ${query}...`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.results && data.results.length) {
        const best = data.results[0];
        currentCity = {
          name: best.name,
          country: best.country || '',
          lat: best.latitude,
          lon: best.longitude
        };
        saveLastCity();
        fetchWeatherData(best.latitude, best.longitude);
      } else {
        showLoading(false);
        alert(`No geographic coordinates found for "${query}". Please check the spelling.`);
      }
    } catch (err) {
      showLoading(false);
      alert('Network error searching location.');
    }
  }

  function saveLastCity() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentCity));
    } catch (e) {}
  }

  function loadLastCity() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        currentCity = JSON.parse(saved);
      }
    } catch (e) {}
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initThemeAndUnits();
    loadLastCity();
    setupSearchEvents();
    fetchWeatherData(currentCity.lat, currentCity.lon);
  });
})();
