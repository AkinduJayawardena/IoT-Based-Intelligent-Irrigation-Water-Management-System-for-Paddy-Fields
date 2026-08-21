# Project Handoff Context: Smart Irrigation Scheduler

This document provides a summary of the work completed and describes the files in this repository.

## Summary of Accomplished Work

1. **Weather Profile Optimization**:
   - Simplified the **Detailed Weather Profile** card layouts. Removed the verbose hourly scrolling lists of badges for Temperature, Humidity, Wind Speed, and Rainfall.
   - Updated the logic to only compute and display the consolidated **Min**, **Max**, and **Mean** values for all meteorological parameters, plus the accumulated **Daily Total** for precipitation.

2. **Soil & Crop Selection**:
   - Integrated dropdown inputs to allow selecting the **Soil Texture** and **Crop Type** directly on the main setup screen.
   - Populated the selections dynamically using lists and parameters imported from the Python threshold calculations file.

3. **Field Properties Screen (Screen 3)**:
   - Added a dedicated, glassmorphic **Field Properties** screen that visualizes:
     - **Field Capacity (FC)**
     - **Permanent Wilting Point (PWP)**
     - **Moisture Threshold Level** calculated using the equation: `Threshold = FC - [MAD * (FC - PWP)]`.
   - Created an interactive **Soil Moisture Spectrum visualizer** highlighting the optimal, depletion, and wilting zones dynamically based on the selected soil and crop configuration.

4. **Screen Navigation**:
   - Added buttons to seamlessly navigate between the initial input screen, the rainfall analysis dashboard, and the field properties analysis.

---

## Directory File Map

Below is a summary of all files in this project workspace:

* **[index.html](file:///c:/Users/Akindu%20Jayawardena/Desktop/web%20app/index.html)**:
  - The entry point structure of the single-page application. Defines the glassmorphic layouts for Screen 1 (Inputs), Screen 2 (Rainfall dashboard & details), and Screen 3 (Field Properties & spectrum visualizer).
* **[app.js](file:///c:/Users/Akindu%20Jayawardena/Desktop/web%20app/app.js)**:
  - Core application script. Handles DOM events, populates inputs, manages screen visibility transitions, pulls forecast data from APIs, runs meteorological calculations, and draws the interactive charts.
* **[styles.css](file:///c:/Users/Akindu%20Jayawardena/Desktop/web%20app/styles.css)**:
  - Design system rules. Provides ambient background animations, dark-themed styling, custom styled dropdown selectors, layout metrics grids, and scrollable timelines.
* **[moisture_threshold_level_.py](file:///c:/Users/Akindu%20Jayawardena/Desktop/web%20app/moisture_threshold_level_.py)**:
  - Reference calculation script containing structural soil thresholds (`SOIL_DATA`) and crop management depletion coefficients (`CROP_DATA`).
* **[demand_calculation.py](file:///c:/Users/Akindu%20Jayawardena/Desktop/web%20app/demand_calculation.py)**:
  - Standalone script containing FAO-56 Penman-Monteith crop water requirement (CWR) and irrigation demand calculator for reference.
* **[run.bat](file:///c:/Users/Akindu%20Jayawardena/Desktop/web%20app/run.bat)**:
  - Convenient launcher script to run the local front-end app in the default web browser.
