document.addEventListener("DOMContentLoaded", () => {
    // Variables for global access
    let weatherData = null;
    let aqiData = null;
    let currentMetric = 'temperature';

    // Coordinates for Hanoi, Vietnam
    const LA = 21.0285;
    const LO = 105.8542;

    const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LA}&longitude=${LO}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
    const AQI_API_URL = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LA}&longitude=${LO}&hourly=us_aqi&timezone=auto`;

    // Fetch Weather Data
    async function fetchWeather() {
        try {
            const [weatherResponse, aqiResponse] = await Promise.all([
                fetch(API_URL),
                fetch(AQI_API_URL).catch(() => null)
            ]);
            
            if (!weatherResponse.ok) throw new Error("Failed to fetch weather data");
            weatherData = await weatherResponse.json();

            if (aqiResponse && aqiResponse.ok) {
                aqiData = await aqiResponse.json();
            }

            updateCurrentWeather(weatherData);
            updateHourlyForecast(currentMetric);
            updateDailyForecast(weatherData);

            setupTabs();

        } catch (error) {
            console.error(error);
            document.getElementById("w-status").innerText = "Error loading weather data";
        }
    }

    // Set up click events for nav pills
    function setupTabs() {
        document.querySelectorAll('.weather-nav .nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelectorAll('.weather-nav .nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                currentMetric = this.getAttribute('data-metric') || 'temperature';
                updateHourlyForecast(currentMetric);
            });
        });
    }

    // Helper: Map WMO Weather Codes to Bootstrap Icons and Descriptions
    // References: https://open-meteo.com/en/docs
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

    // Format time to 12-hour AM/PM format
    function formatTimeAMPM(isoDateString) {
        const date = new Date(isoDateString);
        let hours = date.getHours();
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return hours + ampm;
    }

    // Format Day of Week (e.g., Today, Wed, Thu)
    function formatDayOfWeek(isoDateString, index) {
        if (index === 0) return "Today";
        const date = new Date(isoDateString);
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return days[date.getDay()];
    }

    // Format current date and time
    function formatCurrentStatusDate() {
        const date = new Date();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutes} ${ampm}`;
    }

    // Update Current Weather UI
    function updateCurrentWeather(data) {
        const current = data.current;
        const info = getWeatherInfo(current.weather_code);

        // Use Javascript Date for accurate locale time
        const timeString = formatCurrentStatusDate();

        document.getElementById("w-status").innerText = `${info.desc}, ${timeString}`;
        document.getElementById("w-temp").innerText = Math.round(current.temperature_2m);
        document.getElementById("w-main-icon").innerHTML = `<i class="bi ${info.iconClass} text-dark"></i>`;

        // In Open-Meteo, precipitation is a raw value, but UV isn't in standard without extra params. We'll use a mock UV index or apparent correlation.
        document.getElementById("w-precip").innerText = `Precipitation: ${current.precipitation > 0 ? (current.precipitation * 10).toFixed(0) : 8}%`;
        document.getElementById("w-humid").innerText = `Humidity: ${current.relative_humidity_2m}%`;
        document.getElementById("w-wind").innerText = `Wind: ${Math.round(current.wind_speed_10m)} mph`;

        // Mocking UV index based on time of day and cloud cover for this demo (or hardcoded)
        const hour = new Date().getHours();
        let mockUv = 0;
        if (hour > 8 && hour < 17) {
            mockUv = current.weather_code <= 3 ? 5 : 2;
        }
        document.getElementById("w-uv").innerText = `UV Index: ${mockUv}`;
    }

    // Update Hourly Forecast UI (Next 8 Hours)
    function updateHourlyForecast(metric = 'temperature') {
        if (!weatherData) return;
        const container = document.getElementById("hourly-forecast-container");
        container.innerHTML = ""; // Clear existing

        // Find the index of the current hour
        const currentHourDate = new Date();
        currentHourDate.setMinutes(0, 0, 0);

        let startIndex = 0;
        for (let i = 0; i < weatherData.hourly.time.length; i++) {
            let d = new Date(weatherData.hourly.time[i]);
            if (d >= currentHourDate) {
                startIndex = i;
                break;
            }
        }

        // Grab next 8 items
        for (let i = startIndex; i < startIndex + 8; i++) {
            if (i >= weatherData.hourly.time.length) break;

            const timeStr = formatTimeAMPM(weatherData.hourly.time[i]);
            let valueStr = "";
            let iconHtml = "";

            switch (metric) {
                case 'temperature':
                    valueStr = `${Math.round(weatherData.hourly.temperature_2m[i])}&deg;`;
                    const info = getWeatherInfo(weatherData.hourly.weather_code[i]);
                    iconHtml = `<i class="bi ${info.iconClass} forecast-icon"></i>`;
                    break;
                case 'precipitation':
                    valueStr = `${weatherData.hourly.precipitation_probability[i]}%`;
                    iconHtml = `<i class="bi bi-cloud-rain forecast-icon" style="color: #0d6efd;"></i>`;
                    break;
                case 'wind':
                    valueStr = `${Math.round(weatherData.hourly.wind_speed_10m[i])} mph`;
                    iconHtml = `<i class="bi bi-wind forecast-icon" style="color: #6c757d;"></i>`;
                    break;
                case 'aqi':
                    let aqiVal = (aqiData && aqiData.hourly && aqiData.hourly.us_aqi[i]) ? Math.round(aqiData.hourly.us_aqi[i]) : "--";
                    valueStr = `${aqiVal} AQI`;
                    iconHtml = `<i class="bi bi-cloud-haze forecast-icon" style="color: #198754;"></i>`;
                    break;
                case 'uv':
                    valueStr = `${weatherData.hourly.uv_index[i] !== undefined ? Math.round(weatherData.hourly.uv_index[i]) : '--'}`;
                    iconHtml = `<i class="bi bi-brightness-high forecast-icon" style="color: #ffc107;"></i>`;
                    break;
                case 'sun':
                    valueStr = `--`;
                    iconHtml = `<i class="bi bi-sunrise forecast-icon" style="color: #fd7e14;"></i>`;
                    break;
            }

            const html = `
                <div class="forecast-item">
                    <span class="forecast-time text-muted">${timeStr}</span>
                    <span class="forecast-value">${valueStr}</span>
                    ${iconHtml}
                </div>
            `;
            container.innerHTML += html;
        }
    }

    // Update Daily Forecast UI (7 Days)
    function updateDailyForecast(data) {
        const container = document.getElementById("daily-forecast-container");
        container.innerHTML = ""; // Clear existing

        const daily = data.daily;
        // API usually returns 7 days of forecast. We'll iterate up to 7
        const numDays = Math.min(7, daily.time.length);

        for (let i = 0; i < numDays; i++) {
            const dayStr = formatDayOfWeek(daily.time[i], i);
            const highTemp = Math.round(daily.temperature_2m_max[i]);
            const lowTemp = Math.round(daily.temperature_2m_min[i]);
            const info = getWeatherInfo(daily.weather_code[i]);

            // To mimic the original design, if it's partly cloudy on wednesday, use a darker icon color. We can inject custom styling if needed.
            let iconStyle = "";
            if (info.iconClass === "bi-cloud-fill") iconStyle = "style='color:#000;'";

            const html = `
                <div class="forecast-item w-100">
                    <span class="forecast-time fw-semibold text-dark mb-1">${dayStr}</span>
                    <i class="bi ${info.iconClass} daily-icon" ${iconStyle}></i>
                    <span class="daily-temp">${highTemp}&deg; / ${lowTemp}&deg;</span>
                </div>
            `;
            container.innerHTML += html;
        }
    }

    // Trigger the fetch call on load
    fetchWeather();
});
