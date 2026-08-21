#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

const char* ssid     = "";
const char* password = "";

// Firebase Realtime Database URL
const char* firebaseUrl = "https://smart-irrigation-schedul-d2add-default-rtdb.firebaseio.com/sensor-latest.json";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Skip SSL certificate validation for quick testing

    HTTPClient http;
    http.setTimeout(5000); // 5s timeout

    http.begin(client, firebaseUrl);
    http.addHeader("Content-Type", "application/json");

    // Construct your JSON payload
    
    // 3. Dummy sample values for testing (Replace with actual sensor readings later)
    float sampleMoisture = 42.5;   // Soil moisture (%)
    float sampleTemp     = 29.8;   // Temperature (°C)
    float sampleDistance = 14.2;   // Distance (cm)

    // Build JSON data packet
    String jsonPayload = "{\"moisture\":" + String(sampleMoisture) + 
                         ",\"temperature\":" + String(sampleTemp) + 
                         ",\"waterlevel\":" + String(sampleDistance) + "}";

    int httpResponseCode = http.PUT(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.printf("HTTP Response Code: %d\n", httpResponseCode);
      String response = http.getString();
      Serial.println("Server Response: " + response);
    } else {
      Serial.printf("Error sending PUT: %d\n", httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("Wi-Fi disconnected!");
  }

  delay(10000); // Post data every 10 seconds
}