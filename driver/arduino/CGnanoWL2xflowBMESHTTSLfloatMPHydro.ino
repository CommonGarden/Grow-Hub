///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//WLSENS (eTape) (analog pins A2,A3) (10' 22/4 cable)
//BME280 (i2c pins A4,A5) 
//TSL2561 (i2c pins A4,A5) 
//SHT10 (digital pins 10,11) (Yellow-10, Blue-11)
//2x flowsens (digital pins 2,3) (8'&12' 22/4 cables) 
//float sensor (digital pin 8) (~15' 18/2 cable to nano)
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_TSL2561_U.h>

#include <Adafruit_BME280.h>

#include <SHT1x.h>

//#include <SoftwareSerial.h>
//#include <NDIR_SoftwareSerial.h>

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eTape water level 
#define WLrefPIN A2             //eTape water level reference signal pin
#define WLsensPIN A3            //eTape water level sensor signal pin
int WLsensREAD = 0;             //placeholder for eTape water level sensor readings
int WLrefREAD = 0;              //placeholder for eTape water level reference path readings

#define SEALEVELPRESSURE_HPA (1013.25)
Adafruit_BME280 bme; // I2C

#define SHTdataPIN  10
#define SHTclockPIN 11
SHT1x sht1x(SHTdataPIN, SHTclockPIN);

#define floatSensPIN 8
int floatSensState = 0;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

// flow sensor 1 variables
volatile int  flow_frequency1;  // Measures flow meter pulses
unsigned int  l_hour1;          // Calculated litres/hour                      
unsigned char flowmeter1PIN = 2;   // biochar flow meter pin number

void flow1 ()                   // Interrupt function
{ 
   flow_frequency1++;
} 

// flow sensor 2 variables
volatile int  flow_frequency2;  // Measures flow meter pulses
unsigned int  l_hour2;          // Calculated litres/hour                      
unsigned char flowmeter2PIN = 3;   // nft flow meter pin number

void flow2 ()                   // Interrupt function
{ 
   flow_frequency2++;
} 

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Select 2 digital pins as SoftwareSerial's Rx and Tx. For example, Rx=2 Tx=3
//NDIR_SoftwareSerial mySensor(2, 3);

/* This driver uses the Adafruit unified sensor library (Adafruit_Sensor),
   which provides a common 'type' for sensor data and some helper functions.
   
   To use this driver you will also need to download the Adafruit_Sensor
   library and include it in your libraries folder.

   You should also assign a unique ID to this sensor for use with
   the Adafruit Sensor API so that you can identify this particular
   sensor in any data logs, etc.  To assign a unique ID, simply
   provide an appropriate value in the constructor below (12345
   is used by default in this example).
   
   Connections
   ===========
   Connect SCL to analog 5
   Connect SDA to analog 4
   Connect VDD to 3.3V DC
   Connect GROUND to common ground

   I2C Address
   ===========
   The address will be different depending on whether you leave
   the ADDR pin floating (addr 0x39), or tie it to ground or vcc. 
   The default addess is 0x39, which assumes the ADDR pin is floating
   (not connected to anything).  If you set the ADDR pin high
   or low, use TSL2561_ADDR_HIGH (0x49) or TSL2561_ADDR_LOW
   (0x29) respectively.
    
   History
   =======
   2013/JAN/31  - First version (KTOWN)
*/

//unsigned long delayTime;
   
Adafruit_TSL2561_Unified tsl = Adafruit_TSL2561_Unified(TSL2561_ADDR_FLOAT, 12345);


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**************************************************************************/
/*
    Displays some basic information on this sensor from the unified
    sensor API sensor_t type (see Adafruit_Sensor for more information)
*/
/**************************************************************************/
void displaySensorDetails(void)
{
  sensor_t sensor;
  tsl.getSensor(&sensor);
  /*
  Serial.println("------------------------------------");
  Serial.print  ("Sensor:       "); Serial.println(sensor.name);
  Serial.print  ("Driver Ver:   "); Serial.println(sensor.version);
  Serial.print  ("Unique ID:    "); Serial.println(sensor.sensor_id);
  Serial.print  ("Max Value:    "); Serial.print(sensor.max_value); Serial.println(" lux");
  Serial.print  ("Min Value:    "); Serial.print(sensor.min_value); Serial.println(" lux");
  Serial.print  ("Resolution:   "); Serial.print(sensor.resolution); Serial.println(" lux");  
  Serial.println("------------------------------------");
  Serial.println("");
  */
  delay(500);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**************************************************************************/
/*
    Configures the gain and integration time for the TSL2561
*/
/**************************************************************************/
void configureSensor(void)
{
  /* You can also manually set the gain or enable auto-gain support */
  // tsl.setGain(TSL2561_GAIN_1X);      /* No gain ... use in bright light to avoid sensor saturation */
  // tsl.setGain(TSL2561_GAIN_16X);     /* 16x gain ... use in low light to boost sensitivity */
  tsl.enableAutoRange(true);            /* Auto-gain ... switches automatically between 1x and 16x */
  
  /* Changing the integration time gives you better sensor resolution (402ms = 16-bit data) */
  tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_13MS);      /* fast but low resolution */
  // tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_101MS);  /* medium resolution and speed   */
  // tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_402MS);  /* 16-bit data but slowest conversions */

  /* Update these values depending on what you've set above! */  
  /*
  Serial.println("------------------------------------");
  Serial.print  ("Gain:         "); Serial.println("Auto");
  Serial.print  ("Timing:       "); Serial.println("13 ms");
  Serial.println("------------------------------------");
  */
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**************************************************************************/
/*
    Arduino setup function (automatically called at startup)
*/
/**************************************************************************/
void setup() 
{
  pinMode(flowmeter1PIN, INPUT);
  pinMode(flowmeter2PIN, INPUT);
   
  Serial.begin(9600); 
   
  attachInterrupt(digitalPinToInterrupt(2), flow1, RISING); // Setup Interrupt 
  attachInterrupt(digitalPinToInterrupt(3), flow2, RISING); // Setup Interrupt 
                                     // see http://arduino.cc/en/Reference/attachInterrupt
/*sei();                            // Enable interrupts  
  currentTime1 = millis();
  cloopTime1 = currentTime1;
  currentTime2 = millis();
  cloopTime2 = currentTime2;
*/

  pinMode(floatSensPIN, INPUT);

   
  //Serial.println("Light Sensor Test"); Serial.println("");
  
  /* Initialise the sensor */
  if(!tsl.begin())
  {
    /* There was a problem detecting the ADXL345 ... check your connections */
    Serial.print("Ooops, no TSL2561 detected ... Check your wiring or I2C ADDR!");
    while(1);
  }
  
  /* Display some basic information on the light sensor */
  displaySensorDetails();
  
  /* Setup the sensor gain and integration time */
  configureSensor();
  
  /* We're ready to go! */
  //Serial.println("");


  //Serial.println(F("BME280 test"));

    bool status;
    
    // default settings
    // (you can also pass in a Wire library object like &Wire2)
    status = bme.begin();  
    if (!status) {
        Serial.println("Could not find a valid BME280 sensor, check wiring!");
        while (1);
    }
    
    //Serial.println("-- Default Test --");
    //delayTime = 1000;

    //Serial.println();

    delay(100); // let sensor boot up


/*    //CO2 Sensor setup
    if (mySensor.begin()) {
        //Serial.println("Wait 10 seconds for sensor initialization...");
        delay(10000);
    } else {
        Serial.println("ERROR: Failed to connect to the sensor.");
        while(1);
    }
*/    
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////


void loop() 
{  
  floatSensState = digitalRead(floatSensPIN);
  if (floatSensState == HIGH)
  {  
    Serial.println("Water Level (float): LOW");  
  } else {  
    Serial.println("Water Level (float): GOOD/HIGH");  
  }

  flow_frequency1 = 0;                   //reset counter
  sei();                                 //enable interrupts
  delay (1000);                          //sample for 1s
  // Pulse frequency (Hz) = 7.5Q, Q is flow rate in L/min. (Results in +/- 3% range)
  l_hour1 = (flow_frequency1 * 60 / 7.5);//(Pulse frequency x 60 min) / 7.5Q = flow rate in L/hour 
  Serial.print("Flow Rate Pump 1: ");      
  Serial.print(l_hour1, DEC);            //print litres/hour
  Serial.println(" L/h");
  
  
  flow_frequency2 = 0;                   //reset counter
  sei();                                 //enable interrupts
  delay (1000);                          //sample for 1s
  // Pulse frequency (Hz) = 7.5Q, Q is flow rate in L/min. (Results in +/- 3% range)
  l_hour2 = (flow_frequency2 * 60 / 7.5);//(Pulse frequency x 60 min) / 7.5Q = flow rate in L/hour 
  Serial.print("Flow Rate Pump 2: ");      
  Serial.print(l_hour2, DEC);            //print litres/hour
  Serial.println(" L/h");   


  delay(2000);
  
  /* Read eTape sensor */
  WLsensREAD = analogRead(WLsensPIN);
  WLrefREAD = analogRead(WLrefPIN);
  Serial.print("Water Level Sensor (eTape) Signal: ");
  Serial.println(WLsensREAD);
  Serial.print("Water Level Sensor (eTape) Reference: ");
  Serial.println(WLrefREAD);
  
  /* //calculate difference here & map it, optional
  int WLsensDiff = (WLrefREAD - WLsensREAD);
  int WLsensMap = map(WLsensDiff, 0, WLrefREAD, 0, 100);
  Serial.print("Water Level difference: ");
  Serial.println(WLsensDiff);
  Serial.print("Water Level map: ");
  Serial.println(WLsensMap);
  */
  
  delay(2000);

 
  /* Get a new sensor event */ 
  sensors_event_t event;
  tsl.getEvent(&event);

  Serial.print("Ambient Light (TSL2561): ");
  Serial.print(event.light); 
  Serial.println(" lux");
 
  /*
  // Display the results (light is measured in lux) 
  if (event.light)
  {
    Serial.print("Ambient Light (TSL2561): ");
    Serial.print(event.light); 
    Serial.println(" lux");
  }
  else
  {
    //If event.light = 0 lux the sensor is probably saturated
       and no reliable data could be generated!
    Serial.println("TSL Sensor: 0 or overload");
  }
  */

  
  //delay(2500);

  // Wait between measurements before retrieving the result
  // (You can also configure the sensor to issue an interrupt
  // when measurements are complete)
  
  // This sketch uses the TSL2561's built-in integration timer.
  // You can also perform your own manual integration timing
  // by setting "time" to 3 (manual) in setTiming(),
  // then performing a manualStart() and a manualStop() as in the below
  // commented statements:
  
  // ms = 1000;
  // light.manualStart();


  Serial.print("Air Temperature (BME280): ");
  Serial.print(bme.readTemperature());
  Serial.println(" *C");

  Serial.print("Air Pressure (BME280): ");

  Serial.print(bme.readPressure() / 100.0F);
  Serial.println(" hPa");

  Serial.print("Altitude (BME280): ");
  Serial.print(bme.readAltitude(SEALEVELPRESSURE_HPA));
  Serial.println(" m");

  Serial.print("Relative Humidity (BME280): ");
  Serial.print(bme.readHumidity());
  Serial.println(" %");

  //Serial.println();
/*
  if (mySensor.measure()) {
      Serial.print("CO2: ");
      Serial.print(mySensor.ppm);
      Serial.println(" ppm");
  } else {
      Serial.println("CO2 sensor communication error.");
  }
*/

 // SHT10 variables
 float temp_c;
 float temp_f;
 float humidity;

 // Read values from SHT sensor
 temp_c = sht1x.readTemperatureC();
 temp_f = sht1x.readTemperatureF();
 humidity = sht1x.readHumidity();

 // Print the SHT10 values to the serial port
 Serial.print("Bed Temperature (SHT10): ");
 Serial.print(temp_c, DEC);
 Serial.println(" *C");
 //Serial.print(temp_f, DEC);
 //Serial.println(" *F");
 Serial.print("Bed Humidity (SHT10): ");
 Serial.print(humidity);
 Serial.println(" %");
 Serial.println("");

}
