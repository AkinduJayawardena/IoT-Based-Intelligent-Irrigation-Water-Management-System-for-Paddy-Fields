import http.server
import json
import urllib.parse
import os
import sys
import requests
import time
from datetime import datetime
from demand_calculator import calculate_5_day_demand

PORT = 8000

# Firebase Database Settings
FIREBASE_DB_URL = "https://smart-irrigation-schedul-d2add-default-rtdb.firebaseio.com"

# Global state to store latest ESP32 telemetry reading
latest_sensor_data = {
    "moisture": 0.0,
    "temperature": 0.0,
    "waterlevel": 0.0
}

# Global state to store latest calculated daily weather parameters
latest_weather_data = {
    "temp_mean": 0.0,
    "temp_max": 0.0,
    "temp_min": 0.0,
    "rh_mean": 0.0,
    "u10": 0.0,
    "rain": 0.0,
    "elevation": 0.0
}


def push_to_firebase(path, data):
    try:
        url = f"{FIREBASE_DB_URL}/{path}.json"
        requests.post(url, json=data, timeout=3)
        print(f"[FIREBASE] Pushed data to /{path}")
    except Exception as e:
        print(f"[FIREBASE ERROR] Failed to push to path {path}: {e}")

def set_in_firebase(path, data):
    try:
        url = f"{FIREBASE_DB_URL}/{path}.json"
        requests.put(url, json=data, timeout=3)
        print(f"[FIREBASE] Set data at /{path}")
    except Exception as e:
        print(f"[FIREBASE ERROR] Failed to set path {path}: {e}")


class APIAndFileHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for easier local development/testing across different origins
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/calculate_demand':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                params = json.loads(post_data.decode('utf-8'))
                lat = float(params.get('lat'))
                lon = float(params.get('lon'))
                planting_date = params.get('planting_date') # YYYY-MM-DD
                area = float(params.get('area', 1000))
                channel_efficiency = float(params.get('channel_efficiency', 0.7))
                
                # Execute demand calculation from backend file
                results = calculate_5_day_demand(lat, lon, planting_date, area, channel_efficiency)
                
                # Save only the current daily (today) calculation to Firebase (not future forecast days)
                if results and len(results) > 0:
                    today_calculation = results[0]
                    
                    # Update global latest_weather_data cache
                    global latest_weather_data
                    latest_weather_data = {
                        "temp_mean": today_calculation.get("temp_mean", 0.0),
                        "temp_max": today_calculation.get("temp_max", 0.0),
                        "temp_min": today_calculation.get("temp_min", 0.0),
                        "rh_mean": today_calculation.get("rh_mean", 0.0),
                        "u10": today_calculation.get("u10", 0.0),
                        "rain": today_calculation.get("rain", 0.0),
                        "elevation": today_calculation.get("elevation", 0.0)
                    }
                    
                    demand_log = {
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "lat": lat,
                        "lon": lon,
                        "planting_date": planting_date,
                        "area": area,
                        "channel_efficiency": channel_efficiency,
                        "calculation": today_calculation
                    }
                    push_to_firebase("demand-history", demand_log)

                response_data = {
                    "status": "success",
                    "data": results
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                
            except Exception as e:
                response_data = {
                    "status": "error",
                    "message": str(e)
                }
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
        elif self.path == '/api/sensor-data':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                params = json.loads(post_data.decode('utf-8'))
                global latest_sensor_data
                latest_sensor_data["moisture"] = float(params.get('moisture', 0.0))
                latest_sensor_data["temperature"] = float(params.get('temperature', 0.0))
                latest_sensor_data["waterlevel"] = float(params.get('waterlevel', 0.0))
                
                # Merge sensor parameters with weather parameters
                merged_payload = latest_sensor_data.copy()
                merged_payload.update(latest_weather_data)
                
                # Store latest reading in Firebase
                set_in_firebase("sensor-latest", merged_payload)
                
                # Append to historical logs with timestamp in Firebase
                log_payload = merged_payload.copy()
                log_payload["timestamp"] = datetime.utcnow().isoformat() + "Z"
                push_to_firebase("sensor-history", log_payload)

                response_data = {
                    "status": "success",
                    "message": "Telemetry received successfully"
                }
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
            except Exception as e:
                response_data = {
                    "status": "error",
                    "message": str(e)
                }
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == '/api/sensor-data/latest':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(latest_sensor_data).encode('utf-8'))
        else:
            # Handle base route redirection
            if self.path == '/' or self.path == '':
                self.path = '/index.html'
            super().do_GET()

def run_server():
    # Keep the current directory as the script path to serve web assets
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if script_dir:
        os.chdir(script_dir)
    
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, APIAndFileHandler)
    print(f"=========================================================")
    print(f"  Smart Irrigation Scheduler Server running at:")
    print(f"  http://localhost:{PORT}")
    print(f"=========================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        sys.exit(0)

if __name__ == '__main__':
    run_server()
