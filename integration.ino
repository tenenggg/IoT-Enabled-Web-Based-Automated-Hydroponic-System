#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESPSupabase.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "DFRobot_ESP_PH.h"
#include "DFRobot_ESP_EC.h"
#include <EEPROM.h>

// === WiFi and Supabase ===
const char* ssid = "WaliNurin97";
const char* password = "Akutahu_12";
const char* supabaseUrl = "https://nshoxougnzhvtxvyyskq.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zaG94b3VnbnpodnR4dnl5c2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MDAzOTAsImV4cCI6MjA1Nzk3NjM5MH0.bktULAQH8aTFeW9TVUWbW-XyLOEn1VV0befxl9Mnonk";

int pump1Pin = 16;
int pump2Pin = 17;
int pump3Pin = 18;
int pump4Pin = 19;

Supabase supabase;

// === Sensor Pins and Constants ===
#define ONE_WIRE_BUS 23
#define PH_PIN 35
#define EC_PIN 34
#define ESPADC 4095.0
#define ESPVOLTAGE 3300

// === Sensor Objects ===
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);
DFRobot_ESP_PH phSensor;
DFRobot_ESP_EC ecSensor;

float temperature = 25.0;
float phVoltage = 0.0, ecVoltage = 0.0;
float phValue = 0.0, ecValue = 0.0;

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to Wi-Fi...");
  }
  Serial.println("Wi-Fi connected!");

  supabase.begin(supabaseUrl, supabaseKey);

  EEPROM.begin(64);
  tempSensor.begin();
  phSensor.begin();
  ecSensor.begin();

  Serial.println("Sensors initialized.");

 // Set relay pins as output
  pinMode(pump1Pin, OUTPUT);
  pinMode(pump2Pin, OUTPUT);
  pinMode(pump3Pin, OUTPUT);
  pinMode(pump4Pin, OUTPUT);
  
  // Make sure all pumps are OFF at start
  digitalWrite(pump1Pin, HIGH); // HIGH = OFF for active LOW relay
  digitalWrite(pump2Pin, HIGH);
  digitalWrite(pump3Pin, HIGH);
  digitalWrite(pump4Pin, HIGH);
}

void loop() {
  // === Read Temperature ===
  tempSensor.requestTemperatures();
  temperature = tempSensor.getTempCByIndex(0);
  if (temperature == DEVICE_DISCONNECTED_C || isnan(temperature)) {
    Serial.println("Error: DS18B20 not connected!");
    temperature = 25.0;
  }

  // === Read Voltages ===
  phVoltage = analogRead(PH_PIN) / ESPADC * ESPVOLTAGE;
  ecVoltage = analogRead(EC_PIN) * (3300.0 / 4095.0); //millivolts

  // === Compute Sensor Values ===
  phValue = phSensor.readPH(phVoltage, temperature);
  ecValue = ecSensor.readEC(ecVoltage , temperature);

  Serial.printf("📟 Temp: %.1f°C | pH: %.2f | EC: %.2f\n", temperature, phValue, ecValue);



  // === Supabase: Get selected plant ID ===
  HTTPClient http;
  http.begin("https://nshoxougnzhvtxvyyskq.supabase.co/rest/v1/system_config?select=selected_plant_id&limit=1");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  int httpCode = http.GET();

  String selectedPlantId = "";
  if (httpCode == 200) {
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, http.getString());
    if (doc.size() > 0) {
      selectedPlantId = String((const char*)doc[0]["selected_plant_id"]);
    }
  }
  http.end();

  if (selectedPlantId == "") {
    Serial.println("❌ Could not get plant ID.");
    delay(5000);
    return;
  }

  // === Supabase: Get plant profile ===
  http.begin("https://nshoxougnzhvtxvyyskq.supabase.co/rest/v1/plant_profiles?id=eq." + selectedPlantId + "&select=name,ph_min,ph_max,ec_min,ec_max");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  httpCode = http.GET();

  if (httpCode == 200) {
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, http.getString());

    String plantName = doc[0]["name"];
    float phMin = doc[0]["ph_min"];
    float phMax = doc[0]["ph_max"];
    float ecMin = doc[0]["ec_min"];
    float ecMax = doc[0]["ec_max"];
    
    String tableName = plantName + "_data";

    // JSON Payload
    String jsonData = "{\"water_temperature\": " + String(temperature, 1) +
                      ", \"ph\": " + String(phValue, 2) +
                      ", \"ec\": " + String(ecValue, 2) + "}";

    // Insert into central sensor_data table
    int res2 = supabase.insert("sensor_data", jsonData, false);
    Serial.println(res2 == 200 || res2 == 201 ? "✅ Data -> sensor_data" : "❌ sensor_data insert failed");

    // Pump control logic
    if (phValue < phMin) {
      Serial.println("🚰 Pump 3 ON - PH too LOW");
       digitalWrite(pump3Pin, LOW);  // ON
       delay(3000);
       digitalWrite(pump3Pin, HIGH); // OFF
       
    }
    if (phValue > phMax) {
      Serial.println("🚰 Pump 4 ON - PH too HIGH");
      digitalWrite(pump4Pin, LOW);  // ON
      delay(3000);
      digitalWrite(pump4Pin, HIGH); // OFF
      

    }
     if (ecValue < ecMin) {
      Serial.println("🚰 Pump 3 ON - PH too LOW");
      digitalWrite(pump3Pin, LOW);  // ON
      delay(3000);
      digitalWrite(pump3Pin, HIGH); // OFF
      
    }
    if (ecValue > ecMax) {
      Serial.println("🚰 Pump 4 ON - PH too HIGH");
      digitalWrite(pump4Pin, LOW);  // ON
      delay(3000);
      digitalWrite(pump4Pin, HIGH); // OFF
     
    } 
   

    Serial.printf("🌱 %s | pH: [%.1f - %.1f], EC: [%.1f - %.1f]\n", plantName.c_str(), phMin, phMax, ecMin, ecMax);
  } else {
    Serial.print("❌ Plant profile fetch failed. Code: ");
    Serial.println(httpCode);
  }

// Calibration routine
    phSensor.calibration(phVoltage, temperature);
    ecSensor.calibration(ecVoltage, temperature);
  

  http.end();
  delay(10000);
}
