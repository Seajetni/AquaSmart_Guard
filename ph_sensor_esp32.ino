#define BLYNK_TEMPLATE_ID "TMPL63Cgxb4y0"
#define BLYNK_TEMPLATE_NAME "aquarium"
#define BLYNK_AUTH_TOKEN "GTLpjg8r6vtB_mor5jd1bVkbI2lIIvHA"

#define BLYNK_PRINT Serial

#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ==================================================
// WiFi
// ==================================================

char ssid[] = "test";
char pass[] = "11111110";

// ==================================================
// Pin Configuration
// ==================================================

constexpr uint8_t TDS_SENSOR_PIN = 34;
constexpr uint8_t DS18B20_PIN   = 32;
constexpr uint8_t PH_SENSOR_PIN = 35;


// ==================================================
// Blynk Virtual Pins
// ==================================================

constexpr uint8_t VPIN_TEMPERATURE = V0;
constexpr uint8_t VPIN_TDS         = V1;
constexpr uint8_t VPIN_PH          = V2;


// ==================================================
// ADC Configuration
// ==================================================

constexpr float ADC_VREF = 3.3f;
constexpr float ADC_MAX  = 4095.0f;


// ==================================================
// TDS Configuration
// ==================================================

constexpr uint16_t TDS_SAMPLE_COUNT = 30;


// ==================================================
// Class: TdsSensor
// ==================================================

class TdsSensor
{
private:

  const uint8_t pin;

  int buffer[TDS_SAMPLE_COUNT];
  int sortedBuffer[TDS_SAMPLE_COUNT];

  float voltage = 0.0f;
  float tds = 0.0f;
  int medianADC = 0;


  int getMedianADC()
  {
    for (uint16_t i = 0; i < TDS_SAMPLE_COUNT; i++)
    {
      sortedBuffer[i] = buffer[i];
    }

    // Sort
    for (uint16_t i = 0; i < TDS_SAMPLE_COUNT - 1; i++)
    {
      for (uint16_t j = 0;
           j < TDS_SAMPLE_COUNT - i - 1;
           j++)
      {
        if (sortedBuffer[j] > sortedBuffer[j + 1])
        {
          int temp = sortedBuffer[j];

          sortedBuffer[j] = sortedBuffer[j + 1];

          sortedBuffer[j + 1] = temp;
        }
      }
    }

    // Median ของ 30 ค่า
    medianADC =
      (
        sortedBuffer[TDS_SAMPLE_COUNT / 2] +
        sortedBuffer[TDS_SAMPLE_COUNT / 2 - 1]
      ) / 2;

    return medianADC;
  }


public:

  explicit TdsSensor(uint8_t sensorPin)
    : pin(sensorPin)
  {
  }


  void begin()
  {
    pinMode(pin, INPUT);

    analogSetPinAttenuation(pin, ADC_11db);

    // เติมค่าเริ่มต้นให้ buffer
    int initialValue = analogRead(pin);

    for (uint16_t i = 0; i < TDS_SAMPLE_COUNT; i++)
    {
      buffer[i] = initialValue;
    }

    Serial.println("TDS Sensor initialized");
    Serial.println("TDS Meter V1.0");
    Serial.println("A -> GPIO34");
    Serial.println("+ -> 3.3V");
    Serial.println("- -> GND");
  }


  // อ่าน TDS 30 ค่าแบบเดียวกับโค้ดทดสอบ
  void readSamples()
  {
    for (uint16_t i = 0; i < TDS_SAMPLE_COUNT; i++)
    {
      buffer[i] = analogRead(pin);

      delay(20);
    }
  }


  void calculate(float temperature)
  {
    medianADC = getMedianADC();

    // ADC -> Voltage
    voltage =
      medianADC * ADC_VREF / ADC_MAX;


    // Temperature Compensation
    float compensationCoefficient =
      1.0f + 0.02f * (temperature - 25.0f);


    float compensationVoltage =
      voltage / compensationCoefficient;


    // TDS Formula
    tds =
      (
        133.42f *
        compensationVoltage *
        compensationVoltage *
        compensationVoltage

        -

        255.86f *
        compensationVoltage *
        compensationVoltage

        +

        857.39f *
        compensationVoltage
      ) * 0.5f;


    if (tds < 0)
    {
      tds = 0;
    }
  }


  int getADC() const
  {
    return medianADC;
  }


  float getTds() const
  {
    return tds;
  }


  float getVoltage() const
  {
    return voltage;
  }
};


// ==================================================
// Class: TemperatureSensor
// ==================================================

class TemperatureSensor
{
private:

  OneWire oneWire;

  DallasTemperature sensor;

  float temperature = 25.0f;


public:

  explicit TemperatureSensor(uint8_t sensorPin)
    : oneWire(sensorPin),
      sensor(&oneWire)
  {
  }


  void begin()
  {
    sensor.begin();

    Serial.println("DS18B20 initialized");
  }


  bool read()
  {
    sensor.requestTemperatures();


    float newTemperature =
      sensor.getTempCByIndex(0);


    if (newTemperature == DEVICE_DISCONNECTED_C)
    {
      Serial.println("ERROR: DS18B20 not found!");

      return false;
    }


    temperature = newTemperature;

    return true;
  }


  float getTemperature() const
  {
    return temperature;
  }
};


// ==================================================
// Class: PhSensor
// ==================================================

class PhSensor
{
private:

  const uint8_t pin;

  float ph = 7.0f;
  float voltage = 0.0f;


  // ----------------------------------------------
  // 3-Point Calibration
  // ----------------------------------------------
  //
  // pH 4.00  = 1.7221 V
  // pH 6.86  = 1.2396 V
  // pH 9.18  = 0.8517 V
  //
  // ใช้ทั้ง 3 จุดจริง โดยแบ่งเป็น 2 ช่วง:
  //   ช่วงที่ 1: pH 4.00 -> 6.86
  //   ช่วงที่ 2: pH 6.86 -> 9.18
  //
  // วิธีนี้ทำให้ค่าที่จุด Calibration ทั้ง 3 จุด
  // ถูกคำนวณกลับมาได้ตรงตามค่าที่กำหนด

  static constexpr float CAL_V_PH4   = 1.7221f;
  static constexpr float CAL_V_PH686 = 1.2396f;
  static constexpr float CAL_V_PH918 = 0.8517f;

  static constexpr float CAL_PH4   = 4.00f;
  static constexpr float CAL_PH686 = 6.86f;
  static constexpr float CAL_PH918 = 9.18f;


public:

  explicit PhSensor(uint8_t sensorPin)
    : pin(sensorPin)
  {
  }


  void begin()
  {
    pinMode(pin, INPUT);

    analogSetPinAttenuation(pin, ADC_11db);

    Serial.println("pH Sensor initialized");
    Serial.println("3-Point Calibration:");
    Serial.print("pH 4.00  = ");
    Serial.print(CAL_V_PH4, 4);
    Serial.println(" V");

    Serial.print("pH 6.86  = ");
    Serial.print(CAL_V_PH686, 4);
    Serial.println(" V");

    Serial.print("pH 9.18  = ");
    Serial.print(CAL_V_PH918, 4);
    Serial.println(" V");
  }


  void read()
  {
    const uint16_t samples = 20;

    long total = 0;


    // อ่านหลายครั้งเพื่อลด Noise
    for (uint16_t i = 0; i < samples; i++)
    {
      total += analogRead(pin);

      delayMicroseconds(500);
    }


    float averageADC =
      (float)total / samples;


    // ADC -> Voltage
    voltage =
      averageADC *
      ADC_VREF /
      ADC_MAX;


    // ------------------------------------------
    // 3-Point pH Calculation
    // ------------------------------------------
    //
    // เนื่องจากแรงดันลดลงเมื่อ pH เพิ่มขึ้น
    // จึงใช้สมการเส้นตรง 2 ช่วง
    //
    // ช่วง 1:
    // 1.7221V -> pH 4.00
    // 1.2396V -> pH 6.86
    //
    // ช่วง 2:
    // 1.2396V -> pH 6.86
    // 0.8517V -> pH 9.18

    if (voltage >= CAL_V_PH686)
    {
      // ช่วง pH 4.00 - 6.86
      ph =
        CAL_PH4 +
        (
          (voltage - CAL_V_PH4) *
          (CAL_PH686 - CAL_PH4) /
          (CAL_V_PH686 - CAL_V_PH4)
        );
    }
    else
    {
      // ช่วง pH 6.86 - 9.18
      ph =
        CAL_PH686 +
        (
          (voltage - CAL_V_PH686) *
          (CAL_PH918 - CAL_PH686) /
          (CAL_V_PH918 - CAL_V_PH686)
        );
    }


    // ------------------------------------------
    // จำกัดค่า pH
    // ------------------------------------------

    if (ph < 0.0f)
    {
      ph = 0.0f;
    }


    if (ph > 14.0f)
    {
      ph = 14.0f;
    }
  }


  float getPh() const
  {
    return ph;
  }


  float getVoltage() const
  {
    return voltage;
  }
};



// ==================================================
// Class: AquariumController
// ==================================================

class AquariumController
{
private:

  TdsSensor tdsSensor;

  TemperatureSensor temperatureSensor;

  PhSensor phSensor;

  BlynkTimer timer;


  static constexpr unsigned long SENSOR_INTERVAL = 1000;


  // ==================================================
  // Read All Sensors
  // ==================================================

  void updateSensors()
  {
    // ----------------------------------------------
    // Temperature
    // ----------------------------------------------

    temperatureSensor.read();


    float temperature =
      temperatureSensor.getTemperature();


    // ----------------------------------------------
    // TDS
    // ----------------------------------------------

    // อ่าน 30 ค่า + median แบบโค้ดทดสอบ TDS
    tdsSensor.readSamples();

    tdsSensor.calculate(temperature);


    int tdsADC =
      tdsSensor.getADC();


    float tdsVoltage =
      tdsSensor.getVoltage();


    float tds =
      tdsSensor.getTds();


    // ----------------------------------------------
    // pH
    // ----------------------------------------------

    phSensor.read();


    float ph =
      phSensor.getPh();


    // ----------------------------------------------
    // Serial Monitor
    // ----------------------------------------------

    Serial.println();
    Serial.println("--------------------------------");

    Serial.print("Temperature : ");
    Serial.print(temperature, 1);
    Serial.println(" °C");


    Serial.print("TDS ADC     : ");
    Serial.println(tdsADC);

    Serial.print("TDS Voltage : ");
    Serial.print(tdsVoltage, 3);
    Serial.println(" V");

    Serial.print("TDS         : ");
    Serial.print(tds, 0);
    Serial.println(" ppm");


    Serial.print("pH          : ");
    Serial.println(ph, 2);


    Serial.println("--------------------------------");


    // ----------------------------------------------
    // Blynk
    // ----------------------------------------------

    Blynk.virtualWrite(
      VPIN_TEMPERATURE,
      temperature
    );


    Blynk.virtualWrite(
      VPIN_TDS,
      tds
    );


    Blynk.virtualWrite(
      VPIN_PH,
      ph
    );
  }


public:

  AquariumController()
    : tdsSensor(TDS_SENSOR_PIN),
      temperatureSensor(DS18B20_PIN),
      phSensor(PH_SENSOR_PIN)
  {
  }


  // ==================================================
  // Begin
  // ==================================================

  void begin()
  {
    Serial.begin(115200);


    // ESP32 ADC 12-bit
    analogReadResolution(12);


    // ----------------------------------------------
    // Sensors
    // ----------------------------------------------

    tdsSensor.begin();

    temperatureSensor.begin();

    phSensor.begin();


    // ----------------------------------------------
    // Blynk
    // ----------------------------------------------

    Blynk.begin(
      BLYNK_AUTH_TOKEN,
      ssid,
      pass
    );


    // ----------------------------------------------
    // Read Sensors
    // ----------------------------------------------

    timer.setInterval(
      SENSOR_INTERVAL,
      [this]()
      {
        updateSensors();
      }
    );


    Serial.println();
    Serial.println("================================");
    Serial.println(" Aquarium Controller Started");
    Serial.println("================================");
  }


  // ==================================================
  // Run
  // ==================================================

  void run()
  {
    Blynk.run();

    timer.run();
  }
};


// ==================================================
// Main Object
// ==================================================

AquariumController aquarium;


// ==================================================
// Setup
// ==================================================

void setup()
{
  aquarium.begin();
}


// ==================================================
// Loop
// ==================================================

void loop()
{
  aquarium.run();
}