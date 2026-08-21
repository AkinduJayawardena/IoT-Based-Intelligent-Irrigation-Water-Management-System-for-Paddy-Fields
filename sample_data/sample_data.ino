#include <WiFi.h>
#include <HTTPClient.h>



const char* ssid     = "";
const char* password = "";


const char* serverName = "http://192.168.8.137:8000/api/sensor-data";

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi successfully!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    // 3. Dummy sample values for testing (Replace with actual sensor readings later)
    float sampleMoisture = 42.5;   // Soil moisture (%)
    float sampleTemp     = 29.8;   // Temperature (°C)
    float sampleDistance = 14.2;   // Distance (cm)

    // Build JSON data packet
    String jsonPayload = "{\"moisture\":" + String(sampleMoisture) + 
                         ",\"temperature\":" + String(sampleTemp) + 
                         ",\"waterlevel\":" + String(sampleDistance) + "}";

    // Send HTTP POST request
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("Data sent successfully! Server Response Code: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error sending HTTP POST: ");
      Serial.println(httpResponseCode);
    }

    http.end(); // Free resources
  } else {
    Serial.println("Wi-Fi Disconnected!");
  }

  // Send sample data packet every 5 seconds
  delay(5000);
}