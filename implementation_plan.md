# Implementation Plan: Serverless Deployment on Firebase Hosting

We will transition your architecture to be **100% serverless**. Since Firebase Hosting only serves static files (HTML, CSS, JS) and cannot run a Python server, we will bypass the Python backend entirely:

1. **ESP32** will send telemetry data directly to your **Firebase Realtime Database REST API**.
2. **Frontend UI** will read the telemetry directly from your **Firebase Realtime Database** via `fetch()`.
3. **Frontend UI** will run calculations locally in the browser using the pre-built JavaScript engine (which is identical to the Python logic).

This means you do not need to keep a Python server running on your computer.

---

## Proposed Changes

### 1. ESP32 Code Update
Update the target URL in your Arduino code to point directly to your Firebase database:
```cpp
// Change this:
const char* serverName = "http://10.106.156.161:8000/api/sensor-data";

// To this (writes directly to Firebase Realtime Database):
const char* serverName = "https://smart-irrigation-schedul-d2add-default-rtdb.firebaseio.com/sensor-latest.json";
```
*Note: In the loop, you should use `http.PUT(jsonPayload)` instead of `http.POST` so that the payload overwrites `/sensor-latest.json` rather than appending a generated key.*

### 2. Frontend Updates (app.js)

#### [MODIFY] [app.js](file:///c:/Users/Akindu%20Jayawardena/Desktop/web%20app/app.js)
- Modify `pollLiveSensorData()` to query your Firebase Realtime Database URL:
  `https://smart-irrigation-schedul-d2add-default-rtdb.firebaseio.com/sensor-latest.json`
- Ensure that the demand estimation page directly relies on the `JS Fallback Engine` (which computes Penman-Monteith locally in the browser) when deployed.

---

## Firebase Hosting Deployment Steps

To deploy the frontend to Firebase:
1. Open PowerShell in your web app directory.
2. Install Firebase CLI (if not already installed):
   ```powershell
   npm install -g firebase-tools
   ```
3. Log in to Firebase:
   ```powershell
   firebase login
   ```
4. Initialize your Firebase project:
   ```powershell
   firebase init hosting
   ```
   *Configuration options:*
   - Choose **Use an existing project** and select `smart-irrigation-schedul-d2add`.
   - What do you want to use as your public directory? Enter **`.`** (current directory).
   - Configure as a single-page app? **No**.
   - Set up automatic builds and deploys with GitHub? **No**.
   - Overwrite `index.html`? **No** (crucial to select **No** to keep your file!).
5. Deploy the application:
   ```powershell
   firebase deploy
   ```
   This will give you a public URL (e.g. `https://smart-irrigation-schedul-d2add.web.app`) accessible from anywhere!

---

## Verification Plan

### Manual Verification
1. Deploy frontend to Firebase Hosting using `firebase deploy`.
2. Let the ESP32 send updates directly to the database.
3. Access the deployed web URL on your phone or laptop from another network and verify the telemetry readings update automatically.
