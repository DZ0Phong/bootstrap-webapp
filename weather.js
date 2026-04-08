document.addEventListener("DOMContentLoaded", () => {
    let weatherData = null;
    let aqiData = null;
    let currentMetric = "temperature";
    let currentUnit = "c";

    const LATITUDE = 21.0285;
    const LONGITUDE = 105.8542;

    const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto`;
    const AQI_API_URL = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LATITUDE}&longitude=${LONGITUDE}&hourly=us_aqi&timezone=auto`;

    const unitButtons = Array.from(document.querySelectorAll("[data-unit-toggle]"));
    const unitStat = document.getElementById("unit-stat");

    async function fetchWeather() {
        try {
            const [weatherResponse, aqiResponse] = await Promise.all([
                fetch(API_URL),
                fetch(AQI_API_URL).catch(() => null)
            ]);

            if (!weatherResponse.ok) {
                throw new Error("Failed to fetch weather data");
            }

            weatherData = await weatherResponse.json();

            if (aqiResponse && aqiResponse.ok) {
                aqiData = await aqiResponse.json();
            }

            renderWeather();
            setupTabs();
            setupUnitToggle();
        } catch (error) {
            console.error(error);
            document.getElementById("w-location").innerText = "Hanoi, Vietnam";
            document.getElementById("w-status").innerText = "Unable to load weather data right now";
        }
    }

    function renderWeather() {
        if (!weatherData) return;
        updateCurrentWeather(weatherData);
        updateHourlyForecast(currentMetric);
        updateDailyForecast(weatherData);
        updateUnitUi();
    }

    function setupTabs() {
        document.querySelectorAll(".weather-nav .nav-link").forEach(link => {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                document.querySelectorAll(".weather-nav .nav-link").forEach(item => item.classList.remove("active"));
                this.classList.add("active");
                currentMetric = this.getAttribute("data-metric") || "temperature";
                updateHourlyForecast(currentMetric);
            });
        });
    }

    function setupUnitToggle() {
        unitButtons.forEach(button => {
            button.addEventListener("click", () => {
                currentUnit = button.dataset.unitToggle;
                renderWeather();
            });
        });
    }

    function updateUnitUi() {
        unitButtons.forEach(button => {
            const isActive = button.dataset.unitToggle === currentUnit;
            button.classList.toggle("active", isActive);
        });

        if (unitStat) {
            unitStat.textContent = currentUnit === "c" ? "°C / km/h" : "°F / km/h";
        }
    }

    function getWeatherInfo(code) {
        let iconClass = "bi-cloud-sun-fill";
        let desc = "Mostly Cloudy";

        if (code === 0) { iconClass = "bi-sun-fill"; desc = "Clear Sky"; }
        else if (code === 1 || code === 2) { iconClass = "bi-cloud-sun-fill"; desc = "Partly Cloudy"; }
        else if (code === 3) { iconClass = "bi-cloud-fill"; desc = "Overcast"; }
        else if (code === 45 || code === 48) { iconClass = "bi-cloud-haze-fill"; desc = "Fog"; }
        else if (code >= 51 && code <= 55) { iconClass = "bi-cloud-drizzle-fill"; desc = "Drizzle"; }
        else if (code >= 61 && code <= 65) { iconClass = "bi-cloud-rain-fill"; desc = "Rain"; }
        else if (code >= 71 && code <= 77) { iconClass = "bi-snow"; desc = "Snow"; }
        else if (code >= 80 && code <= 82) { iconClass = "bi-cloud-rain-heavy-fill"; desc = "Rain Showers"; }
        else if (code >= 95 && code <= 99) { iconClass = "bi-cloud-lightning-rain-fill"; desc = "Thunderstorm"; }

        return { iconClass, desc };
    }

    function toDisplayTemperature(value) {
        if (currentUnit === "f") {
            return Math.round((value * 9) / 5 + 32);
        }
        return Math.round(value);
    }

    function getTemperatureSuffix() {
        return currentUnit === "f" ? "F" : "C";
    }

    function formatTimeAMPM(isoDateString) {
        const date = new Date(isoDateString);
        let hours = date.getHours();
        const ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}${ampm}`;
    }

    function formatDayOfWeek(isoDateString, index) {
        if (index === 0) return "Today";
        const date = new Date(isoDateString);
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return days[date.getDay()];
    }

    function formatCurrentStatusDate() {
        const date = new Date();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${hours}:${minutes} ${ampm}`;
    }

    function updateCurrentWeather(data) {
        const current = data.current;
        const info = getWeatherInfo(current.weather_code);
        const timeString = formatCurrentStatusDate();

        document.getElementById("w-location").innerText = "Hanoi, Vietnam";
        document.getElementById("w-status").innerText = `${info.desc}, ${timeString}`;
        document.getElementById("w-temp").innerText = toDisplayTemperature(current.temperature_2m);
        document.getElementById("w-main-icon").innerHTML = `<i class="bi ${info.iconClass} text-dark"></i>`;
        document.getElementById("temp-unit-label").innerText = getTemperatureSuffix();

        document.getElementById("w-precip").innerHTML = `<strong>Precipitation</strong><span>${current.precipitation > 0 ? Math.round(current.precipitation) : 8}%</span>`;
        document.getElementById("w-humid").innerHTML = `<strong>Humidity</strong><span>${current.relative_humidity_2m}%</span>`;
        document.getElementById("w-wind").innerHTML = `<strong>Wind</strong><span>${Math.round(current.wind_speed_10m)} km/h</span>`;

        const hour = new Date().getHours();
        let mockUv = 0;
        if (hour > 8 && hour < 17) {
            mockUv = current.weather_code <= 3 ? 5 : 2;
        }
        document.getElementById("w-uv").innerHTML = `<strong>UV Index</strong><span>${mockUv}</span>`;
    }

    function updateHourlyForecast(metric = "temperature") {
        if (!weatherData) return;
        const container = document.getElementById("hourly-forecast-container");
        container.innerHTML = "";

        const currentHourDate = new Date();
        currentHourDate.setMinutes(0, 0, 0);

        let startIndex = 0;
        for (let i = 0; i < weatherData.hourly.time.length; i++) {
            const date = new Date(weatherData.hourly.time[i]);
            if (date >= currentHourDate) {
                startIndex = i;
                break;
            }
        }

        for (let i = startIndex; i < startIndex + 8; i++) {
            if (i >= weatherData.hourly.time.length) break;

            const timeStr = formatTimeAMPM(weatherData.hourly.time[i]);
            let valueStr = "";
            let iconHtml = "";

            switch (metric) {
                case "temperature": {
                    const info = getWeatherInfo(weatherData.hourly.weather_code[i]);
                    valueStr = `${toDisplayTemperature(weatherData.hourly.temperature_2m[i])}&deg;`;
                    iconHtml = `<i class="bi ${info.iconClass} forecast-icon"></i>`;
                    break;
                }
                case "precipitation":
                    valueStr = `${weatherData.hourly.precipitation_probability[i]}%`;
                    iconHtml = `<i class="bi bi-cloud-rain forecast-icon" style="color:#0d6efd;"></i>`;
                    break;
                case "wind":
                    valueStr = `${Math.round(weatherData.hourly.wind_speed_10m[i])} km/h`;
                    iconHtml = `<i class="bi bi-wind forecast-icon" style="color:#6c757d;"></i>`;
                    break;
                case "aqi": {
                    const aqiVal = aqiData && aqiData.hourly && aqiData.hourly.us_aqi[i] ? Math.round(aqiData.hourly.us_aqi[i]) : "--";
                    valueStr = `${aqiVal} AQI`;
                    iconHtml = `<i class="bi bi-cloud-haze forecast-icon" style="color:#198754;"></i>`;
                    break;
                }
                case "uv":
                    valueStr = `${weatherData.hourly.uv_index[i] !== undefined ? Math.round(weatherData.hourly.uv_index[i]) : "--"}`;
                    iconHtml = `<i class="bi bi-brightness-high forecast-icon" style="color:#f59e0b;"></i>`;
                    break;
                case "sun":
                    valueStr = "--";
                    iconHtml = `<i class="bi bi-sunrise forecast-icon" style="color:#f97316;"></i>`;
                    break;
            }

            container.innerHTML += `
                <div class="forecast-item">
                    <span class="forecast-time text-muted">${timeStr}</span>
                    <span class="forecast-value">${valueStr}</span>
                    ${iconHtml}
                </div>
            `;
        }
    }

    function updateDailyForecast(data) {
        const container = document.getElementById("daily-forecast-container");
        container.innerHTML = "";

        const daily = data.daily;
        const numDays = Math.min(7, daily.time.length);

        for (let i = 0; i < numDays; i++) {
            const dayStr = formatDayOfWeek(daily.time[i], i);
            const highTemp = toDisplayTemperature(daily.temperature_2m_max[i]);
            const lowTemp = toDisplayTemperature(daily.temperature_2m_min[i]);
            const info = getWeatherInfo(daily.weather_code[i]);
            let iconStyle = "";

            if (info.iconClass === "bi-cloud-fill") {
                iconStyle = "style='color:#000;'";
            }

            container.innerHTML += `
                <div class="forecast-item w-100">
                    <span class="forecast-time fw-semibold text-dark mb-1">${dayStr}</span>
                    <i class="bi ${info.iconClass} daily-icon" ${iconStyle}></i>
                    <span class="daily-temp">${highTemp}&deg; / ${lowTemp}&deg; ${getTemperatureSuffix()}</span>
                </div>
            `;
        }
    }

    fetchWeather();
});
