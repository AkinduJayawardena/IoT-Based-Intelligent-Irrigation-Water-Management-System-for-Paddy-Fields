//locally host code
#include <WiFi.h>
#include <HTTPClient.h>

#include <OneWire.h>
#include <DallasTemperature.h>

// 1. Enter your local Wi-Fi details
// 2. Replace 192.168.X.X with your laptop's Local IPv4 address found in Step 1
const char* ssid     = "";
const char* password = "";
const char* serverName = "";








//constant and variable for data gathering from sensors
// Define Pin Numbers
const int TRIG_PIN = 5;  // ESP32 GPIO 5 (D5)
const int ECHO_PIN = 18; // ESP32 GPIO 18 (D18)

// Define speed of sound in cm/us
#define SOUND_SPEED 0.034

long duration;
float distanceCm;

// Data wire is plugged into GPIO 4 on the ESP32
#define ONE_WIRE_BUS 4

// Setup a oneWire instance to communicate with any OneWire devices
OneWire oneWire(ONE_WIRE_BUS);

// Pass our oneWire reference to Dallas Temperature sensor 
DallasTemperature sensors(&oneWire);

// Define Pin Configurations 
const int SENSOR_VCC_PIN = 25; // Powers the sensor on/off
const int ANALOG_PIN     = 32; // Reads the analog soil moisture (AO)
const int DIGITAL_PIN    = 26; // Reads the digital threshold (DO)

// soil noisture threshold
const int dryValue = 3688; // air 
const int wetValue = 1425; // minaral water

//triggering for ultra sonic sensor 
void blank_trigger() {
  // Clear the TRIG_PIN condition
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  
  // Sets the TRIG_PIN HIGH (ACTIVE) for 10 microseconds
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
}


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

  //sensor port define

  pinMode(TRIG_PIN, OUTPUT); // Sets the TRIG_PIN as an Output
  pinMode(ECHO_PIN, INPUT);  // Sets the ECHO_PIN as an Input

  // Configure pins
  //pinMode(SENSOR_VCC_PIN, OUTPUT);
  pinMode(DIGITAL_PIN, INPUT);
  
  // Start with the sensor powered off to save life
  digitalWrite(SENSOR_VCC_PIN, LOW); 
  
  Serial.println("Soil Moisture Sensor Initialized.");
  Serial.println("DS18B20 Temperature Sensor Initializing...");

    // Start up the library
  sensors.begin();

}

void loop() {
  //sensor data 

  // ultra sonic sensor ----> distance  
  // Trigger the ultrasonic burst
  blank_trigger();
  
  // Reads the ECHO_PIN, returns the sound wave travel time in microseconds
  duration = pulseIn(ECHO_PIN, HIGH);
  
  // Calculate the distance
  // (Duration is divided by 2 because the wave travels to the object and back)
  distanceCm = duration * SOUND_SPEED / 2;
  
  // Prints the distance on the Serial Monitor
  Serial.print("Distance (cm): ");
  Serial.println(distanceCm);
  
  // Wait 500ms before next measurement
  delay(500);

  // temperature  reading
    // Send the command to all sensors on the line to grab temperature readings
  Serial.print("Requesting temperatures...");
  sensors.requestTemperatures(); 
  Serial.println(" DONE");
  
  // Fetch temperature in Celsius for the first device on the bus (index 0)
  float tempC = sensors.getTempCByIndex(0);

  // Check if the reading was successful
  if(tempC != DEVICE_DISCONNECTED_C) {
    Serial.print("Temperature: ");
    Serial.print(tempC);
    Serial.println(" °C");
  } 
  else {
    Serial.println("Error: Could not read temperature data. Check wiring/resistor.");
  }
  
  // Wait 2 seconds before taking the next reading
  delay(2000);

  // 2. Read the values
  int analogValue = analogRead(ANALOG_PIN);


  // 4. Map the raw analog value to a rough percentage
  // ESP32 ADC has 12-bit resolution (0 to 3688). 
  // Remember: 3688 = bone dry (max resistance), 1425 = completely wet (min resistance).
  

  float moisturePercentage = (float)((dryValue - analogValue) /(dryValue - wetValue)) * 100.0;

  Serial.print("Calculated Moisture: ");
  Serial.println(moisturePercentage);

  // Take a reading every 2 seconds
  delay(2000);

  // wifi 
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");


    // Build JSON data packet
    String jsonPayload = "{\"moisture\":" + String(moisturePercentage) + 
                         ",\"temperature\":" + String(tempC) + 
                         ",\"waterlevel\":" + String(distanceCm) + "}";

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