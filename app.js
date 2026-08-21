// Rainfall & Meteorological Details Visualizer Logic
const OPENWEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY";

// Soil water thresholds
const SOIL_DATA = {
    "Sand": {"FC": 10, "PWP": 4},
    "Loamy sand": {"FC": 16, "PWP": 7},
    "Sandy loam": {"FC": 21, "PWP": 9},
    "Loam": {"FC": 27, "PWP": 12},
    "Silt loam": {"FC": 30, "PWP": 15},
    "Sandy clay loam": {"FC": 36, "PWP": 16},
    "Sandy clay": {"FC": 32, "PWP": 18},
    "Clay loam": {"FC": 29, "PWP": 18},
    "Silty clay loam": {"FC": 28, "PWP": 15},
    "Silty clay": {"FC": 40, "PWP": 20},
    "Clay": {"FC": 40, "PWP": 22}
};

// Crop management allowed depletion (MAD)
const CROP_DATA = {
    "Cotton": {"MAD": 0.65},
    "Barley and oats": {"MAD": 0.55},
    "Maize": {"MAD": 0.50},
    "Sorghum": {"MAD": 0.50},
    "Rice": {"MAD": 0.20},
    "Beans": {"MAD": 0.45},
    "Soybeans": {"MAD": 0.50},
    "Alfalfa": {"MAD": 0.50},
    "Cool season – Turf grass": {"MAD": 0.40},
    "Warm season – Turf grass": {"MAD": 0.50},
    "Citrus": {"MAD": 0.50},
    "Walnut orchard": {"MAD": 0.50},
    "Carrots": {"MAD": 0.35},
    "Cantaloupes/watermelons": {"MAD": 0.40},
    "Lettuce": {"MAD": 0.30},
    "Onions": {"MAD": 0.30},
    "Potatoes": {"MAD": 0.65},
    "Sweet peppers": {"MAD": 0.30},
    "Cucumbers": {"MAD": 0.50}
};

// Global Cache Variables
let weatherTimeline = [];
let locationElevation = null;
let rainfallChart = null;

// Initialize form defaults on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    // Set default date to today
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    document.getElementById("date-input").value = todayStr;

    // Set default planting date to 30 days before today
    const defaultPlanting = new Date();
    defaultPlanting.setDate(today.getDate() - 30);
    document.getElementById("planting-date-input").value = defaultPlanting.toISOString().split("T")[0];

    // Set default coordinates (Colombo, Sri Lanka)
    document.getElementById("lat-input").value = "6.9271";
    document.getElementById("lon-input").value = "79.8612";

    // Populate Soil Texture dropdown dynamically
    const soilSelect = document.getElementById("soil-select");
    Object.keys(SOIL_DATA).forEach(soilKey => {
        const opt = document.createElement("option");
        opt.value = soilKey;
        opt.textContent = soilKey;
        soilSelect.appendChild(opt);
    });

    // Populate Crop Type dropdown dynamically
    const cropSelect = document.getElementById("crop-select");
    Object.keys(CROP_DATA).forEach(cropKey => {
        const opt = document.createElement("option");
        opt.value = cropKey;
        opt.textContent = cropKey;
        cropSelect.appendChild(opt);
    });

    // Setup event listeners
    document.getElementById("weather-form").addEventListener("submit", handleFormSubmit);
    document.getElementById("btn-detect-location").addEventListener("click", detectUserLocation);
    document.getElementById("btn-back").addEventListener("click", showInputScreen);
    
    // New navigation buttons event listeners
    document.getElementById("btn-to-field").addEventListener("click", showFieldScreen);
    document.getElementById("btn-to-demand").addEventListener("click", showDemandScreen);
    document.getElementById("btn-field-to-demand").addEventListener("click", showDemandScreen);
    document.getElementById("btn-back-to-dashboard").addEventListener("click", showDashboardScreen);
    document.getElementById("btn-back-to-inputs").addEventListener("click", showInputScreen);

    document.getElementById("btn-demand-to-dashboard").addEventListener("click", showDashboardScreen);
    document.getElementById("btn-demand-to-field").addEventListener("click", showFieldScreen);
    document.getElementById("btn-demand-to-inputs").addEventListener("click", showInputScreen);

    // Live sensor telemetry polling initialization
    pollLiveSensorData();
    setInterval(pollLiveSensorData, 3000);
});

// Screen transitions: Show Input Form
function showInputScreen() {
    const inputScreen = document.getElementById("input-screen");
    const dashboardScreen = document.getElementById("dashboard-screen");
    const fieldScreen = document.getElementById("field-screen");
    const demandScreen = document.getElementById("demand-screen");
    
    dashboardScreen.classList.remove("active");
    fieldScreen.classList.remove("active");
    demandScreen.classList.remove("active");
    setTimeout(() => {
        dashboardScreen.style.display = "none";
        fieldScreen.style.display = "none";
        demandScreen.style.display = "none";
        inputScreen.style.display = "block";
        setTimeout(() => inputScreen.classList.add("active"), 50);
    }, 400);
}

// Screen transitions: Show Dashboard
function showDashboardScreen() {
    const inputScreen = document.getElementById("input-screen");
    const dashboardScreen = document.getElementById("dashboard-screen");
    const fieldScreen = document.getElementById("field-screen");
    const demandScreen = document.getElementById("demand-screen");

    inputScreen.classList.remove("active");
    fieldScreen.classList.remove("active");
    demandScreen.classList.remove("active");
    setTimeout(() => {
        inputScreen.style.display = "none";
        fieldScreen.style.display = "none";
        demandScreen.style.display = "none";
        dashboardScreen.style.display = "block";
        setTimeout(() => dashboardScreen.classList.add("active"), 50);
    }, 400);
}

// Screen transitions: Show Field Properties Screen
function showFieldScreen() {
    const inputScreen = document.getElementById("input-screen");
    const dashboardScreen = document.getElementById("dashboard-screen");
    const fieldScreen = document.getElementById("field-screen");
    const demandScreen = document.getElementById("demand-screen");

    inputScreen.classList.remove("active");
    dashboardScreen.classList.remove("active");
    demandScreen.classList.remove("active");
    
    // Calculate and render the properties
    calculateAndRenderFieldProperties();

    setTimeout(() => {
        inputScreen.style.display = "none";
        dashboardScreen.style.display = "none";
        demandScreen.style.display = "none";
        fieldScreen.style.display = "block";
        setTimeout(() => fieldScreen.classList.add("active"), 50);
    }, 400);
}

// Screen transitions: Show Demand Estimation Screen
function showDemandScreen() {
    const inputScreen = document.getElementById("input-screen");
    const dashboardScreen = document.getElementById("dashboard-screen");
    const fieldScreen = document.getElementById("field-screen");
    const demandScreen = document.getElementById("demand-screen");

    inputScreen.classList.remove("active");
    dashboardScreen.classList.remove("active");
    fieldScreen.classList.remove("active");

    setTimeout(() => {
        inputScreen.style.display = "none";
        dashboardScreen.style.display = "none";
        fieldScreen.style.display = "none";
        demandScreen.style.display = "block";
        setTimeout(() => demandScreen.classList.add("active"), 50);
    }, 400);
}

// Compute and display Field Properties
function calculateAndRenderFieldProperties() {
    const soilTexture = document.getElementById("soil-select").value;
    const cropType = document.getElementById("crop-select").value;

    if (!soilTexture || !cropType) return;

    const fc = SOIL_DATA[soilTexture].FC;
    const pwp = SOIL_DATA[soilTexture].PWP;
    const mad = CROP_DATA[cropType].MAD;

    // Core equation: Threshold = FC - [MAD * (FC - PWP)]
    const threshold = fc - (mad * (fc - pwp));

    // Update labels and values
    document.getElementById("field-soil-crop-label").innerHTML = `<i class="fa-solid fa-earth-americas"></i> Soil Texture: <strong>${soilTexture}</strong> | <i class="fa-solid fa-wheat-awn"></i> Crop: <strong>${cropType}</strong>`;
    document.getElementById("field-fc-val").textContent = `${fc.toFixed(1)}%`;
    document.getElementById("field-pwp-val").textContent = `${pwp.toFixed(1)}%`;
    document.getElementById("field-threshold-val").textContent = `${threshold.toFixed(2)}%`;
    document.getElementById("field-mad-desc").textContent = `MAD: ${mad.toFixed(2)} (${cropType})`;

    // Spectrum bar markers updates
    const maxScale = fc * 1.1;
    const pwpPercent = (pwp / maxScale) * 100;
    const thresholdPercent = (threshold / maxScale) * 100;
    const fcPercent = (fc / maxScale) * 100;

    document.getElementById("marker-pwp").style.left = `${pwpPercent}%`;
    document.getElementById("marker-threshold").style.left = `${thresholdPercent}%`;
    document.getElementById("marker-fc").style.left = `${fcPercent}%`;

    // Visual zones width and position
    document.getElementById("visual-wilting-zone").style.width = `${pwpPercent}%`;
    
    document.getElementById("visual-depletion-zone").style.left = `${pwpPercent}%`;
    document.getElementById("visual-depletion-zone").style.width = `${thresholdPercent - pwpPercent}%`;

    document.getElementById("visual-optimal-zone").style.left = `${thresholdPercent}%`;
    document.getElementById("visual-optimal-zone").style.width = `${100 - thresholdPercent}%`;

    // Update labels at the bottom of the spectrum bar
    document.getElementById("label-visual-pwp").textContent = `PWP: ${pwp.toFixed(1)}%`;
    document.getElementById("label-visual-threshold").textContent = `Threshold: ${threshold.toFixed(2)}%`;
    document.getElementById("label-visual-fc").textContent = `FC: ${fc.toFixed(1)}%`;
}

// Status Display Helpers
function showError(message) {
    const errorEl = document.getElementById("form-error-msg");
    const errorText = document.getElementById("error-text");
    errorText.textContent = message;
    errorEl.style.display = "flex";
    errorEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideError() {
    document.getElementById("form-error-msg").style.display = "none";
}

// Geolocation Hook
function detectUserLocation() {
    const btn = document.getElementById("btn-detect-location");
    const origHtml = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Detecting...';
    hideError();

    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        btn.disabled = false;
        btn.innerHTML = origHtml;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            document.getElementById("lat-input").value = position.coords.latitude.toFixed(4);
            document.getElementById("lon-input").value = position.coords.longitude.toFixed(4);
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Found!';
            setTimeout(() => {
                btn.innerHTML = origHtml;
            }, 2000);
        },
        (error) => {
            let errorMsg = "Unable to retrieve location.";
            if (error.code === error.PERMISSION_DENIED) {
                errorMsg = "Location access denied. Please type coordinates manually.";
            }
            showError(errorMsg);
            btn.disabled = false;
            btn.innerHTML = origHtml;
        },
        { enableHighAccuracy: true, timeout: 6000 }
    );
}

// Calculate the 10-day window dates around target date
function get10DayWindow(targetDateStr) {
    const dates = [];
    const parts = targetDateStr.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const targetDate = new Date(year, month, day);

    for (let i = -5; i <= 4; i++) {
        const d = new Date(targetDate);
        d.setDate(targetDate.getDate() + i);

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dayStr}`;

        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        dates.push({
            date: d,
            dateStr: dateStr,
            label: label,
            // Main chart rainfall metrics
            rainfall: 0,
            source: "No Data",
            // Meteorological Profile Lists
            T_list: [],
            Tmean: null,
            Tmax: null,
            Tmin: null,
            RH_list: [],
            RHmean: null,
            wind_list: [],
            u10: null, // Mean wind speed
            rain_list: [],
            rain: 0    // Daily sum
        });
    }
    return dates;
}

// Fetch Elevation from Open-Elevation API
async function fetchElevation(lat, lon) {
    try {
        const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
        if (!res.ok) throw new Error("Elevation lookup failed.");
        const data = await res.json();
        if (data && data.results && data.results[0]) {
            return parseFloat(data.results[0].elevation.toFixed(1));
        }
    } catch (e) {
        console.warn("Could not retrieve elevation data, defaulting to null.", e);
    }
    return null;
}

// Form Submission Orchestration
async function handleFormSubmit(e) {
    e.preventDefault();
    hideError();

    const lat = parseFloat(document.getElementById("lat-input").value);
    const lon = parseFloat(document.getElementById("lon-input").value);
    const dateStr = document.getElementById("date-input").value;

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lon) || lon < -180 || lon > 180) {
        showError("Please enter valid Latitude (-90 to 90) and Longitude (-180 to 180).");
        return;
    }

    if (!dateStr) {
        showError("Please select a target date.");
        return;
    }

    const btn = document.getElementById("btn-confirm");
    btn.classList.add("loading");

    try {
        // 1. Fetch static elevation first
        locationElevation = await fetchElevation(lat, lon);
        
        // 2. Generate 10-day timeline
        weatherTimeline = get10DayWindow(dateStr);
        
        // 3. Aggregate all weather data
        await fetchWeatherData(lat, lon, weatherTimeline);
        
        // 4. Render main layer (Dashboard)
        renderDashboard(lat, lon, weatherTimeline);
        
        // 5. Select active day tab ("day include firstly" -> target date day)
        let activeIdx = weatherTimeline.findIndex(d => d.dateStr === dateStr);
        if (activeIdx === -1) activeIdx = 5; // Fallback to index 5
        
        buildTimelineTabs(weatherTimeline, activeIdx);
        selectTimelineDay(activeIdx);
        
        // 6. Transition to Layer 2 and Layer 3
        showDashboardScreen();

        // 7. Calculate and render Demand Estimation data
        const plantingDate = document.getElementById("planting-date-input").value;
        const area = parseFloat(document.getElementById("area-input").value);
        const efficiency = parseFloat(document.getElementById("efficiency-input").value);
        await loadAndRenderDemandData(lat, lon, plantingDate, area, efficiency);
    } catch (err) {
        console.error(err);
        showError("Error processing weather analysis: " + err.message);
    } finally {
        btn.classList.remove("loading");
    }
}

// Unified Weather Data Fetcher: Merging OpenWeatherMap and Open-Meteo
async function fetchWeatherData(lat, lon, timeline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const historicalDays = timeline.filter(t => {
        const itemDate = new Date(t.date);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate < today;
    });

    const forecastDays = timeline.filter(t => {
        const itemDate = new Date(t.date);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate >= today;
    });

    // 1. HISTORICAL DAYS: Open-Meteo Archive (hourly parameters)
    if (historicalDays.length > 0) {
        const startStr = historicalDays[0].dateStr;
        const endStr = historicalDays[historicalDays.length - 1].dateStr;
        
        try {
            const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startStr}&end_date=${endStr}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&timezone=auto`;
            const res = await fetch(archiveUrl);
            if (!res.ok) throw new Error("Open-Meteo Historical Archive API call failed.");
            
            const data = await res.json();
            if (data && data.hourly && data.hourly.time) {
                // Map hourly outputs to corresponding timeline days
                data.hourly.time.forEach((dateTimeStr, index) => {
                    const parts = dateTimeStr.split("T");
                    const dateVal = parts[0];
                    const timeVal = parts[1];
                    
                    const match = historicalDays.find(item => item.dateStr === dateVal);
                    if (match) {
                        const temp = data.hourly.temperature_2m[index];
                        const rh = data.hourly.relative_humidity_2m[index];
                        const wind = data.hourly.wind_speed_10m[index];
                        const precip = data.hourly.precipitation[index];

                        if (temp !== null) match.T_list.push({ time: timeVal, value: temp });
                        if (rh !== null) match.RH_list.push({ time: timeVal, value: rh });
                        if (wind !== null) match.wind_list.push({ time: timeVal, value: wind });
                        if (precip !== null) match.rain_list.push({ time: timeVal, value: precip });
                    }
                });

                // Compute aggregates for history
                historicalDays.forEach(day => {
                    day.source = "Open-Meteo Archive";
                    computeDayAggregates(day);
                });
            }
        } catch (e) {
            console.warn("Failed historical fetch, default to empty data.", e);
            historicalDays.forEach(day => {
                day.source = "Failed to Fetch Archive";
            });
        }
    }

    // 2. FORECAST DAYS: OpenWeatherMap 5-Day Forecast (3-hour intervals, metric units)
    let openWeatherSuccess = false;
    let openWeatherForecastData = null;

    if (forecastDays.length > 0) {
        try {
            // Fetch metric values (temp in Celsius, wind in m/s)
            const owUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
            const res = await fetch(owUrl);
            if (res.ok) {
                openWeatherForecastData = await res.json();
                openWeatherSuccess = true;
            } else {
                console.warn(`OpenWeather forecast status ${res.status}. Falling back to Open-Meteo Forecast.`);
            }
        } catch (e) {
            console.warn("OpenWeather forecast request failed/blocked. Falling back to Open-Meteo Forecast.", e);
        }

        if (openWeatherSuccess && openWeatherForecastData && openWeatherForecastData.list) {
            forecastDays.forEach(fDay => {
                let foundMatch = false;

                openWeatherForecastData.list.forEach(entry => {
                    // entry.dt_txt is in UTC "YYYY-MM-DD HH:MM:SS"
                    const parts = entry.dt_txt.split(" ");
                    const entryDateStr = parts[0];
                    const entryTimeStr = parts[1].substring(0, 5); // get "HH:MM"

                    if (entryDateStr === fDay.dateStr) {
                        foundMatch = true;
                        
                        const temp = entry.main.temp;
                        const rh = entry.main.humidity;
                        const wind = entry.wind.speed;
                        const rainVal = (entry.rain && entry.rain["3h"]) ? entry.rain["3h"] : 0;

                        fDay.T_list.push({ time: entryTimeStr, value: temp });
                        fDay.RH_list.push({ time: entryTimeStr, value: rh });
                        fDay.wind_list.push({ time: entryTimeStr, value: wind });
                        fDay.rain_list.push({ time: entryTimeStr, value: rainVal });
                    }
                });

                if (foundMatch) {
                    fDay.source = "OpenWeather Forecast";
                    computeDayAggregates(fDay);
                } else {
                    fDay.needFallback = true;
                }
            });
        } else {
            forecastDays.forEach(fDay => { fDay.needFallback = true; });
        }

        // 3. FORECAST FALLBACK: Open-Meteo Forecast API (covers up to 16 days hourly forecast)
        const missingForecastDays = forecastDays.filter(fDay => fDay.needFallback || fDay.T_list.length === 0);
        if (missingForecastDays.length > 0) {
            try {
                const omForecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&timezone=auto&forecast_days=16`;
                const res = await fetch(omForecastUrl);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.hourly && data.hourly.time) {
                        data.hourly.time.forEach((dateTimeStr, index) => {
                            const parts = dateTimeStr.split("T");
                            const dateVal = parts[0];
                            const timeVal = parts[1];

                            const match = missingForecastDays.find(item => item.dateStr === dateVal);
                            if (match) {
                                // Clear any incomplete listings to prevent mixing
                                if (match.needFallback) {
                                    match.T_list = [];
                                    match.RH_list = [];
                                    match.wind_list = [];
                                    match.rain_list = [];
                                    delete match.needFallback;
                                }

                                const temp = data.hourly.temperature_2m[index];
                                const rh = data.hourly.relative_humidity_2m[index];
                                const wind = data.hourly.wind_speed_10m[index];
                                const precip = data.hourly.precipitation[index];

                                if (temp !== null) match.T_list.push({ time: timeVal, value: temp });
                                if (rh !== null) match.RH_list.push({ time: timeVal, value: rh });
                                if (wind !== null) match.wind_list.push({ time: timeVal, value: wind });
                                if (precip !== null) match.rain_list.push({ time: timeVal, value: precip });
                            }
                        });

                        missingForecastDays.forEach(day => {
                            day.source = "Open-Meteo Forecast";
                            computeDayAggregates(day);
                        });
                    }
                }
            } catch (e) {
                console.error("Open-Meteo Forecast fallback also failed.", e);
                missingForecastDays.forEach(day => {
                    day.source = "Failed to Fetch Forecast";
                });
            }
        }
    }
}

// Compute Statistics and aggregates for a timeline day
function computeDayAggregates(day) {
    // Temperature computations
    if (day.T_list.length > 0) {
        const temps = day.T_list.map(t => t.value);
        day.Tmax = Math.max(...temps);
        day.Tmin = Math.min(...temps);
        day.Tmean = temps.reduce((acc, v) => acc + v, 0) / temps.length;
    } else {
        day.Tmax = day.Tmin = day.Tmean = null;
    }

    // Relative humidity computation
    if (day.RH_list.length > 0) {
        const humidities = day.RH_list.map(h => h.value);
        day.RHmax = Math.max(...humidities);
        day.RHmin = Math.min(...humidities);
        day.RHmean = humidities.reduce((acc, v) => acc + v, 0) / humidities.length;
    } else {
        day.RHmax = day.RHmin = day.RHmean = null;
    }

    // Wind speed computation
    if (day.wind_list.length > 0) {
        const winds = day.wind_list.map(w => w.value);
        day.windMax = Math.max(...winds);
        day.windMin = Math.min(...winds);
        day.u10 = winds.reduce((acc, v) => acc + v, 0) / winds.length;
    } else {
        day.windMax = day.windMin = day.u10 = null;
    }

    // Rainfall sum computation
    if (day.rain_list.length > 0) {
        const rainSums = day.rain_list.map(r => r.value);
        day.rain = rainSums.reduce((acc, v) => acc + v, 0);
        day.rainMax = Math.max(...rainSums);
        day.rainMin = Math.min(...rainSums);
        day.rainMean = rainSums.reduce((acc, v) => acc + v, 0) / rainSums.length;
    } else {
        day.rain = 0;
        day.rainMax = day.rainMin = day.rainMean = null;
    }

    // Assign main chart rainfall
    day.rainfall = parseFloat(day.rain.toFixed(2));
}

// Render Dashboard (Layer 2) Summary Statistics & Main Chart
function renderDashboard(lat, lon, timeline) {
    const locationTitle = document.getElementById("dashboard-location-title");
    locationTitle.textContent = `Precipitation Report: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
    
    const coordLabel = document.getElementById("lbl-coordinates");
    coordLabel.textContent = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;

    const dateRangeLabel = document.getElementById("dashboard-date-range");
    const startLabel = timeline[0].label;
    const endLabel = timeline[timeline.length - 1].label;
    dateRangeLabel.innerHTML = `<i class="fa-solid fa-calendar-day"></i> Timeline: ${startLabel} — ${endLabel}`;

    // Calculate statistical summaries
    let totalRain = 0;
    let maxRain = 0;
    let maxRainDate = "N/A";

    timeline.forEach(day => {
        totalRain += day.rainfall;
        if (day.rainfall > maxRain) {
            maxRain = day.rainfall;
            maxRainDate = day.label;
        }
    });

    totalRain = parseFloat(totalRain.toFixed(2));
    maxRain = parseFloat(maxRain.toFixed(2));

    document.getElementById("metric-total-rain").textContent = `${totalRain} mm`;
    document.getElementById("metric-max-rain").textContent = `${maxRain} mm`;
    document.getElementById("metric-max-rain-day").textContent = maxRain > 0 ? `On ${maxRainDate}` : "No rain recorded";

    // Set weather classification status
    const statusValEl = document.getElementById("metric-status");
    const statusDescEl = document.getElementById("metric-status-desc");

    if (totalRain === 0) {
        statusValEl.textContent = "Dry Period";
        statusValEl.style.color = "#a3a3a3";
        statusDescEl.textContent = "0mm total rain. Clear skies.";
    } else if (totalRain < 10) {
        statusValEl.textContent = "Light Showers";
        statusValEl.style.color = "#38bdf8";
        statusDescEl.textContent = "Occasional sprinkles.";
    } else if (totalRain < 40) {
        statusValEl.textContent = "Moderate Rain";
        statusValEl.style.color = "#60a5fa";
        statusDescEl.textContent = "Steady rain observed.";
    } else {
        statusValEl.textContent = "Heavy Rainfall";
        statusValEl.style.color = "#a78bfa";
        statusDescEl.textContent = "Potential storms / wet soil.";
    }

    // Build the Chart
    buildRainfallChart(timeline);
}

// Draw chart and wire click events
function buildRainfallChart(timeline) {
    const ctx = document.getElementById("rainfall-chart").getContext("2d");

    if (rainfallChart !== null) {
        rainfallChart.destroy();
    }

    const labels = timeline.map(t => t.label);
    const rainData = timeline.map(t => t.rainfall);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(56, 189, 248, 0.8)");
    gradient.addColorStop(0.5, "rgba(99, 102, 241, 0.4)");
    gradient.addColorStop(1, "rgba(99, 102, 241, 0.05)");

    rainfallChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Precipitation (mm)",
                data: rainData,
                backgroundColor: gradient,
                borderColor: "#38bdf8",
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.6,
                maxBarThickness: 45,
                order: 2
            },
            {
                label: "Trend Index",
                data: rainData,
                type: "line",
                borderColor: "rgba(34, 211, 238, 0.8)",
                borderWidth: 2,
                pointBackgroundColor: "#22d3ee",
                pointBorderColor: "#fff",
                pointBorderWidth: 1.5,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.35,
                fill: false,
                order: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // Handle clicking chart bars to select a day
            onClick: (event, activeElements) => {
                if (activeElements && activeElements.length > 0) {
                    const clickedIndex = activeElements[0].index;
                    selectTimelineDay(clickedIndex);
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: "top",
                    labels: {
                        color: "#9ca3af",
                        font: {
                            family: "'Outfit', sans-serif",
                            size: 12,
                            weight: 500
                        },
                        boxWidth: 14,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: "rgba(11, 14, 38, 0.95)",
                    titleColor: "#fff",
                    titleFont: {
                        family: "'Outfit', sans-serif",
                        size: 13,
                        weight: 700
                    },
                    bodyColor: "#e5e7eb",
                    bodyFont: {
                        family: "'Outfit', sans-serif",
                        size: 12
                    },
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            const idx = context.dataIndex;
                            const src = timeline[idx].source;
                            return [
                                `Rainfall: ${val} mm`,
                                `Source: ${src}`,
                                `Click bar to view full details`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: "rgba(255, 255, 255, 0.04)",
                        drawTicks: false
                    },
                    ticks: {
                        color: "#9ca3af",
                        font: {
                            family: "'Outfit', sans-serif",
                            size: 11
                        },
                        padding: 8
                    }
                },
                y: {
                    grid: {
                        color: "rgba(255, 255, 255, 0.05)",
                        drawTicks: false
                    },
                    ticks: {
                        color: "#9ca3af",
                        font: {
                            family: "'Outfit', sans-serif",
                            size: 11
                        },
                        padding: 8,
                        callback: function(value) {
                            return value + " mm";
                        }
                    },
                    min: 0,
                    suggestedMax: 10
                }
            },
            animation: {
                duration: 1200,
                easing: "easeOutQuart"
            }
        }
    });
}

// Build the Timeline Navigation buttons
function buildTimelineTabs(timeline, activeIndex) {
    const container = document.getElementById("timeline-tabs");
    container.innerHTML = "";
    
    timeline.forEach((day, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `timeline-tab-btn ${idx === activeIndex ? 'active' : ''}`;
        
        const labelSpan = document.createElement("strong");
        labelSpan.textContent = day.label;
        
        const rainSpan = document.createElement("span");
        rainSpan.className = "tab-sub";
        rainSpan.textContent = `${day.rainfall.toFixed(1)} mm`;
        
        btn.appendChild(labelSpan);
        btn.appendChild(rainSpan);
        
        btn.addEventListener("click", () => selectTimelineDay(idx));
        container.appendChild(btn);
    });

    // Auto-scroll timeline selector row to center the selected day tab
    setTimeout(() => {
        const activeTab = container.querySelector(".timeline-tab-btn.active");
        if (activeTab) {
            activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
    }, 120);
}

// Select a day from timeline
function selectTimelineDay(index) {
    const tabs = document.querySelectorAll(".timeline-tab-btn");
    tabs.forEach((tab, i) => {
        if (i === index) {
            tab.classList.add("active");
            tab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        } else {
            tab.classList.remove("active");
        }
    });

    renderDetailedDay(index);
}

// Render Daily Meteorological Profile (Layer 3)
function renderDetailedDay(index) {
    const day = weatherTimeline[index];
    if (!day) return;

    // Header Details
    document.getElementById("details-date-title").textContent = `Detailed Weather Profile: ${day.label} (${day.dateStr})`;
    
    const elevEl = document.getElementById("details-elevation");
    if (locationElevation !== null) {
        elevEl.innerHTML = `<i class="fa-solid fa-mountain"></i> Elevation: ${locationElevation} m`;
        elevEl.style.display = "flex";
    } else {
        elevEl.innerHTML = `<i class="fa-solid fa-mountain"></i> Elevation: N/A`;
    }

    // Temperature Metrics
    document.getElementById("det-temp-mean").textContent = day.Tmean !== null ? `${day.Tmean.toFixed(1)} °C` : "-- °C";
    document.getElementById("det-temp-max").textContent = day.Tmax !== null ? `${day.Tmax.toFixed(1)} °C` : "-- °C";
    document.getElementById("det-temp-min").textContent = day.Tmin !== null ? `${day.Tmin.toFixed(1)} °C` : "-- °C";

    // Relative Humidity Metrics
    document.getElementById("det-rh-mean").textContent = day.RHmean !== null ? `${Math.round(day.RHmean)} %` : "-- %";
    document.getElementById("det-rh-max").textContent = day.RHmax !== null ? `${Math.round(day.RHmax)} %` : "-- %";
    document.getElementById("det-rh-min").textContent = day.RHmin !== null ? `${Math.round(day.RHmin)} %` : "-- %";

    // Wind Speed Metrics
    document.getElementById("det-wind-mean").textContent = day.u10 !== null ? `${day.u10.toFixed(1)} m/s` : "-- m/s";
    document.getElementById("det-wind-max").textContent = day.windMax !== null ? `${day.windMax.toFixed(1)} m/s` : "-- m/s";
    document.getElementById("det-wind-min").textContent = day.windMin !== null ? `${day.windMin.toFixed(1)} m/s` : "-- m/s";

    // Rainfall Metrics
    document.getElementById("det-rain-sum").textContent = `${day.rainfall.toFixed(2)} mm`;
    document.getElementById("det-rain-mean").textContent = day.rainMean !== null ? `${day.rainMean.toFixed(2)} mm` : "-- mm";
    document.getElementById("det-rain-max").textContent = day.rainMax !== null ? `${day.rainMax.toFixed(2)} mm` : "-- mm";
    document.getElementById("det-rain-min").textContent = day.rainMin !== null ? `${day.rainMin.toFixed(2)} mm` : "-- mm";

    // Reveal Layer 3 details panel with slide transition
    const panel = document.getElementById("details-panel-container");
    panel.style.display = "block";
}

// Helper: Populate time badges list
function updateBadgeList(elementId, list, suffix = "", decimalPlaces = 1) {
    const container = document.getElementById(elementId);
    container.innerHTML = "";
    
    if (!list || list.length === 0) {
        container.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem; padding: 4px; display: inline-block;">No hourly data available</span>';
        return;
    }

    list.forEach(item => {
        const badge = document.createElement("div");
        badge.className = "time-badge";
        
        const timeSpan = document.createElement("span");
        timeSpan.className = "badge-time";
        timeSpan.textContent = item.time;
        
        const valSpan = document.createElement("span");
        valSpan.className = "badge-value";
        valSpan.textContent = `${item.value.toFixed(decimalPlaces)}${suffix}`;
        
        badge.appendChild(timeSpan);
        badge.appendChild(valSpan);
        container.appendChild(badge);
    });
}

// -------------------------------------------------------------
// DEMAND ESTIMATION BACKEND INTEGRATION & JS FALLBACK ENGINE
// -------------------------------------------------------------

function getKc(day) {
    if (day <= 15) return 0.5;
    if (day <= 30) return 0.8;
    if (day <= 45) return 1.2;
    if (day <= 75) return 1.3;
    if (day <= 90) return 1.2;
    if (day <= 105) return 1.1;
    return 0.7;
}

function calculateNetRadiationJS(Tmin, Tmax, ea, latDeg, dateStr, elevationM) {
    const dateObj = new Date(dateStr);
    
    // Day of year calculation
    const year = dateObj.getFullYear();
    const start = new Date(year, 0, 1);
    const diff = dateObj - start + ((start.getTimezoneOffset() - dateObj.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const J = Math.floor(diff / oneDay) + 1;

    const phi = (Math.PI / 180) * latDeg;
    const d_r = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * J);
    const delta = 0.409 * Math.sin((2 * Math.PI / 365) * J - 1.39);

    let arg_acos = -Math.tan(phi) * Math.tan(delta);
    if (arg_acos > 1) arg_acos = 1;
    if (arg_acos < -1) arg_acos = -1;
    const omega_s = Math.acos(arg_acos);

    const G_sc = 0.0820;
    const R_a = (24 * 60 / Math.PI) * G_sc * d_r * (
        omega_s * Math.sin(phi) * Math.sin(delta) +
        Math.cos(phi) * Math.cos(delta) * Math.sin(omega_s)
    );

    const temp_diff = Tmax - Tmin;
    const k_Rs = 0.16;
    const R_s = k_Rs * R_a * Math.sqrt(temp_diff);
    const R_so = (0.75 + 2e-5 * elevationM) * R_a;
    const albedo = 0.23;
    const R_ns = (1 - albedo) * R_s;

    const sigma = 4.903e-9;
    const Tmax_K = Tmax + 273.16;
    const Tmin_K = Tmin + 273.16;
    const mean_temp_term = (Math.pow(Tmax_K, 4) + Math.pow(Tmin_K, 4)) / 2;
    const vapor_term = 0.34 - 0.14 * Math.sqrt(ea);
    const cloud_term = R_so > 0 ? (1.35 * (R_s / R_so) - 0.35) : -0.35;

    const R_nl = sigma * mean_temp_term * vapor_term * cloud_term;
    const R_n_MJ = R_ns - R_nl;
    const latent_heat = 2.45;
    return R_n_MJ / latent_heat;
}

async function calculate5DayDemandJS(lat, lon, plantingDateStr, area, efficiency) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`);
    if (!res.ok) throw new Error("Weather forecast API fetch failed.");
    const data = await res.json();

    const dailyGroups = {};
    data.list.forEach(entry => {
        const dateStr = entry.dt_txt.split(" ")[0];
        if (!dailyGroups[dateStr]) {
            dailyGroups[dateStr] = {
                temp_list: [],
                rh_list: [],
                wind_list: [],
                rain_list: []
            };
        }
        dailyGroups[dateStr].temp_list.push(entry.main.temp);
        dailyGroups[dateStr].rh_list.push(entry.main.humidity);
        dailyGroups[dateStr].wind_list.push(entry.wind.speed);
        
        const rainVal = (entry.rain && entry.rain["3h"]) ? entry.rain["3h"] : 0;
        dailyGroups[dateStr].rain_list.push(rainVal);
    });

    const sortedDates = Object.keys(dailyGroups).sort();
    const targetDates = sortedDates.slice(0, 5);

    const plantingDate = new Date(plantingDateStr);
    const elevation = locationElevation !== null ? locationElevation : 500;

    const results = [];
    for (const dateStr of targetDates) {
        const group = dailyGroups[dateStr];
        const temps = group.temp_list;
        const humidities = group.rh_list;
        const winds = group.wind_list;
        const rains = group.rain_list;

        if (temps.length === 0) continue;

        const Tmean = temps.reduce((a, b) => a + b, 0) / temps.length;
        const RHmean = humidities.reduce((a, b) => a + b, 0) / humidities.length;
        const u10 = winds.reduce((a, b) => a + b, 0) / winds.length;
        const rain = rains.reduce((a, b) => a + b, 0);
        const Tmax = Math.max(...temps);
        const Tmin = Math.min(...temps);

        const u2 = u10 * 0.748;
        const es = 0.6108 * Math.exp((17.27 * Tmean) / (Tmean + 237.3));
        const ea = (RHmean / 100) * es;
        const Delta = (4098 * es) / Math.pow(Tmean + 237.3, 2);
        const gamma = 0.0665;

        const Rn = calculateNetRadiationJS(Tmin, Tmax, ea, lat, dateStr, elevation);
        const fu = 0.27 * (1 + u2 / 100);
        const W = Delta / (Delta + gamma);
        const ET0 = (W * Rn) + ((1 - W) * fu * (es - ea));

        const dateObj = new Date(dateStr);
        const diffTime = Math.abs(dateObj - plantingDate);
        const daysAfterPlanting = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const Kc = getKc(daysAfterPlanting);

        const CWR = Kc * ET0;
        const Reff = 0.8 * rain;
        const demand = Math.max(0.0, ((CWR - Reff) * area) / efficiency);

        results.push({
            date: dateStr,
            days_after_planting: daysAfterPlanting,
            kc: parseFloat(Kc.toFixed(2)),
            temp_mean: parseFloat(Tmean.toFixed(2)),
            temp_max: parseFloat(Tmax.toFixed(2)),
            temp_min: parseFloat(Tmin.toFixed(2)),
            rh_mean: parseFloat(RHmean.toFixed(2)),
            et0: parseFloat(Math.max(0.0, ET0).toFixed(2)),
            cwr: parseFloat(Math.max(0.0, CWR).toFixed(2)),
            rain: parseFloat(rain.toFixed(2)),
            demand: parseFloat(demand.toFixed(2)),
            elevation: parseFloat(elevation.toFixed(2))
        });
    }
    return results;
}

async function loadAndRenderDemandData(lat, lon, plantingDate, area, channelEfficiency) {
    const statusBadge = document.getElementById("demand-backend-status");
    const elevLabel = document.getElementById("demand-elevation-label");
    const tableBody = document.getElementById("demand-table-body");
    const cardsContainer = document.getElementById("demand-cards-container");

    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Calculating Demand Data...</td></tr>`;
    cardsContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Calculating Demand Data...</div>`;

    let results = null;
    let backendUsed = "Python Backend";

    try {
        const res = await fetch("http://localhost:8000/api/calculate_demand", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                lat: lat,
                lon: lon,
                planting_date: plantingDate,
                area: area,
                channel_efficiency: channelEfficiency
            })
        });

        if (!res.ok) {
            throw new Error(`Server status ${res.status}`);
        }

        const resData = await res.json();
        if (resData.status === "success") {
            results = resData.data;
        } else {
            throw new Error(resData.message || "Server error");
        }
    } catch (e) {
        console.warn("Python backend offline. Falling back to local JS calculation:", e);
        backendUsed = "JS Fallback Engine";
        try {
            results = await calculate5DayDemandJS(lat, lon, plantingDate, area, channelEfficiency);
        } catch (jsError) {
            console.error("Local JS calculation failed:", jsError);
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--error); padding: 20px;"><i class="fa-solid fa-circle-exclamation"></i> Error: ${jsError.message}</td></tr>`;
            cardsContainer.innerHTML = `<div style="text-align: center; color: var(--error); padding: 20px;"><i class="fa-solid fa-circle-exclamation"></i> Error: ${jsError.message}</div>`;
            return;
        }
    }

    if (!results || results.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">No forecast data available.</td></tr>`;
        cardsContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">No forecast data available.</div>`;
        return;
    }

    // Update Status Badge and Elevation
    if (backendUsed === "Python Backend") {
        statusBadge.innerHTML = `<i class="fa-solid fa-server"></i> Python Backend Online`;
        statusBadge.className = "status-badge";
    } else {
        statusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Local JS Engine (Backend Offline)`;
        statusBadge.className = "status-badge fallback";
    }

    const firstResult = results[0];
    elevLabel.innerHTML = `<i class="fa-solid fa-mountain"></i> Elevation: ${firstResult.elevation} m`;

    // Render Table
    tableBody.innerHTML = "";
    results.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: 500;">${row.date}</td>
            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">${row.days_after_planting} days</td>
            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">${row.kc.toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">${row.cwr.toFixed(2)} mm/day</td>
            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">${row.et0.toFixed(2)} mm/day</td>
            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">${row.rain.toFixed(2)} mm</td>
            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right; color: var(--accent); font-weight: 700; font-size: 1.05rem;">
                ${row.demand.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} L/day
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Render Cards for mobile
    cardsContainer.innerHTML = "";
    results.forEach(row => {
        const card = document.createElement("div");
        card.className = "demand-day-card";
        card.innerHTML = `
            <div class="demand-day-card-header">
                <span class="demand-day-card-date">${row.date}</span>
                <span class="demand-day-card-demand">${row.demand.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} L</span>
            </div>
            <div class="demand-day-card-grid">
                <div class="demand-day-card-item">
                    <span>Days after Planting</span>
                    <span>${row.days_after_planting} days</span>
                </div>
                <div class="demand-day-card-item">
                    <span>Kc Coefficient</span>
                    <span>${row.kc.toFixed(2)}</span>
                </div>
                <div class="demand-day-card-item">
                    <span>Crop Water Req (CWR)</span>
                    <span>${row.cwr.toFixed(2)} mm/day</span>
                </div>
                <div class="demand-day-card-item">
                    <span>Evaporation (ET0)</span>
                    <span>${row.et0.toFixed(2)} mm/day</span>
                </div>
                <div class="demand-day-card-item">
                    <span>Rainfall</span>
                    <span>${row.rain.toFixed(2)} mm</span>
                </div>
            </div>
        `;
        cardsContainer.appendChild(card);
    });
}

// Poll live ESP32 sensor telemetry
async function pollLiveSensorData() {
    try {
        const response = await fetch('https://smart-irrigation-schedul-d2add-default-rtdb.firebaseio.com/sensor-latest.json');
        if (response.ok) {
            const data = await response.json();
            
            // Update UI elements
            const moistureEl = document.getElementById("live-moisture-val");
            const tempEl = document.getElementById("live-temp-val");
            const waterEl = document.getElementById("live-water-val");
            
            if (moistureEl && data.moisture !== undefined && data.moisture !== null) {
                moistureEl.textContent = `${data.moisture.toFixed(1)}%`;
            }
            if (tempEl && data.temperature !== undefined && data.temperature !== null) {
                tempEl.textContent = `${data.temperature.toFixed(1)}°C`;
            }
            if (waterEl && data.waterlevel !== undefined && data.waterlevel !== null) {
                waterEl.textContent = `${data.waterlevel.toFixed(1)} cm`;
            }
        }
    } catch (err) {
        console.warn("Could not fetch latest live sensor telemetry:", err);
    }
}

