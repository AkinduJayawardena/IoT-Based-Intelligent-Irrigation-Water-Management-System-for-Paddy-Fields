# Smart Irrigation Scheduler

An AI-powered Water Management System for agricultural purposes in Sri Lanka. This web application provides a premium dashboard to visualize precipitation, calculate irrigation demand, and integrate with hardware (ESP32) for smart farming.

**🔗 Live Demo:** [https://smart-irrigation-schedul-d2add.web.app/](https://smart-irrigation-schedul-d2add.web.app/)

## Features
- **Weather Analysis**: Visualizes daily rainfall data for past 5 days and future 4 days using OpenWeather and Open-Meteo APIs.
- **Irrigation Demand Calculator**: Computes crop water requirements based on location, planting date, field area, and soil texture.
- **IoT Integration**: Receives real-time telemetry from ESP32 sensors (soil moisture, temperature, water level).
- **Cloud Logging**: Pushes calculated demand and real-time sensor data directly to Firebase Realtime Database.
- **Modern UI**: A responsive, glassmorphism-styled dashboard tailored for farm management.

## Project Structure
- `index.html` - Main frontend interface
- `styles.css` - Custom UI styling
- `app.js` - Frontend logic and API interaction
- `server.py` - Python backend HTTP server that handles API requests and Firebase synchronization.
- `demand_calculator.py` - Core logic for calculating 5-day crop water demand.
- `moisture_threshold_level_.py` - Logic for managing irrigation based on moisture levels.

## Setup & Running

1. **Install Requirements**
   Ensure you have Python 3 installed. Install the necessary Python packages:
   ```bash
   pip install requests
   ```

2. **Run the Server**
   Start the local backend server (defaults to port 8000):
   ```bash
   python server.py
   ```
   Alternatively, on Windows, you can double-click `run.bat`.

3. **Access the App**
   Open your browser and navigate to `http://localhost:8000` to view the application.

## Technologies Used
- HTML5 / Vanilla CSS / JavaScript
- FontAwesome (Icons)
- Python (http.server)
- Firebase Realtime Database
- Open-Meteo & OpenWeather APIs
