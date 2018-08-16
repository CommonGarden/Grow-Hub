//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ENV-TMP (analog pin A0) 
//  //// TO ADD: ////  WLSENS (eTape) (analog pins A2,A3) (10' 22/4 cable)
//BME280 (i2c pins A4,A5) 
//TSL2561 (i2c pins A4,A5) 
//pH (analog pH out (Po) pin A6, analog temp out (T1) pin A7, digital temp DS18B20 (T2) pin 10)
//float sensor (binary hi-lo) (digital read pin 4)
//DS18B20 (1-wire pin 12) 
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#include <Wire.h>

#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_TSL2561_U.h>

#include <SoftwareSerial.h>      //we have to include the SoftwareSerial library, or else we can't use it

#include <OneWire.h>
#include <DallasTemperature.h>

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Atlas Scientific ENV-TMP
#define tmpPIN A0
float temp;                     //where the final ENV-TMP temperature data is stored

// eTape water level 
#define WLrefPIN A2             //eTape water level reference signal pin
#define WLsensPIN A3            //eTape water level sensor signal pin
int WLsensREAD = 0;             //placeholder for eTape water level sensor readings
int WLrefREAD = 0;              //placeholder for eTape water level reference path readings

// "Logo_PHsensor v2.0" analog pH module with onboard LM35 (analog temp) & remote DS18B20 (digital temp)
#define pHanalogPIN A6
#define pHLM35PIN A7
#define pHdigitempPIN 10
float pHanalog;
float pHLM35;                                     


// binary float sensor for water level
#define binFloatPIN 4          //binary float sensor input pin (digital)
int binFloatState = 0;         //placeholder for binary float sensor state


// Dallas data wire on the nano
//#define ONE_WIRE_BUS1 10
#define ONE_WIRE_BUS2 12
#define TEMPERATURE_PRECISION1 9 // Lower resolution
#define TEMPERATURE_PRECISION2 9 // Lower resolution

// Setup a oneWire instance to communicate with any OneWire devices (not just Maxim/Dallas temperature ICs)
OneWire oneWire1(pHdigitempPIN);
OneWire oneWire2(ONE_WIRE_BUS2);

// Pass our oneWire reference to Dallas Temperature. 
DallasTemperature sensors1(&oneWire1);
DallasTemperature sensors2(&oneWire2);

int numberOfDevices1; // Number of temperature devices found
int numberOfDevices2; // Number of temperature devices found

DeviceAddress tempDeviceAddress1; // We'll use this variable to store a found device address
DeviceAddress tempDeviceAddress2; // We'll use this variable to store a found device address


#define SEALEVELPRESSURE_HPA (1013.25)
Adafruit_BME280 bme; // I2C
unsigned long delayTime;


///////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

void setup() {    //main loop
  
  Serial.begin(9600);       //set up the hardware serial port to run at 9600

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
  status = bme.begin();     // keep??
  if (!status) {
      Serial.println("Could not find a valid BME280 sensor, check wiring!");
      while (1);
  }
  //Serial.println("-- Default Test --");
  //delayTime = 1000;


  // Start up the Dallas library
  sensors1.begin();
  sensors2.begin();
  
  // Grab a count of devices on the wire
  numberOfDevices1 = sensors1.getDeviceCount();
  numberOfDevices2 = sensors2.getDeviceCount();

  // locate devices on the bus
  Serial.print("Locating devices...");
  
  Serial.print("Found ");
  Serial.print(numberOfDevices1, DEC);
  Serial.print(" on bus1, and: ");
  Serial.print(numberOfDevices2, DEC);
  Serial.println(" on bus2.");


  // report parasite power requirements
  Serial.print("Parasite power on bus1 is: "); 
  if (sensors1.isParasitePowerMode()) Serial.println("ON");
  else Serial.println("OFF");

  Serial.print("Parasite power on bus2 is: "); 
  if (sensors2.isParasitePowerMode()) Serial.println("ON");
  else Serial.println("OFF");

  
  // Loop through each device, print out address
  for(int i=0;i<numberOfDevices1; i++)
  {
      // Search the wire for address
      if(sensors1.getAddress(tempDeviceAddress1, i))
      {
        Serial.print("Found device ");
        Serial.print(i, DEC);
        Serial.print(" with address: ");
        printAddress(tempDeviceAddress1);
        Serial.println();
       
        Serial.print("Setting resolution to ");
        Serial.println(TEMPERATURE_PRECISION1, DEC);
        
        // set the resolution to TEMPERATURE_PRECISION bit (Each Dallas/Maxim device is capable of several different resolutions)
        sensors1.setResolution(tempDeviceAddress1, TEMPERATURE_PRECISION1);
        
        Serial.print("Resolution actually set to: ");
        Serial.print(sensors1.getResolution(tempDeviceAddress1), DEC); 
        Serial.println();
      }else{
        Serial.print("Found ghost device at ");
        Serial.print(i, DEC);
        Serial.print(" but could not detect address. Check power and cabling");
      }   
  }
  // Loop through each device, print out address
  for(int i=0;i<numberOfDevices2; i++)
  {
      // Search the wire for address
      if(sensors2.getAddress(tempDeviceAddress2, i))
      {
        Serial.print("Found device ");
        Serial.print(i, DEC);
        Serial.print(" with address: ");
        printAddress(tempDeviceAddress2);
        Serial.println();
       
        Serial.print("Setting resolution to ");
        Serial.println(TEMPERATURE_PRECISION2, DEC);
        
        // set the resolution to TEMPERATURE_PRECISION bit (Each Dallas/Maxim device is capable of several different resolutions)
        sensors2.setResolution(tempDeviceAddress2, TEMPERATURE_PRECISION2);
        
        Serial.print("Resolution actually set to: ");
        Serial.print(sensors2.getResolution(tempDeviceAddress2), DEC); 
        Serial.println();
      }else{
        Serial.print("Found ghost device at ");
        Serial.print(i, DEC);
        Serial.print(" but could not detect address. Check power and cabling");
      }   
  }

  
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////


void loop() {

  delay(1000);              //wait 1000ms before we do it again

  Serial.println();
  temp = read_temp();       //call the ENV-TMP function “read_temp” and return the temperature in C°
  Serial.print("Water Temperature (ENV-TMP): ");
  Serial.println(temp);     //print the temperature data


  /* Read eTape sensor */
  WLsensREAD = analogRead(WLsensPIN);
  WLrefREAD = analogRead(WLrefPIN);

  Serial.print("Water Level: ");
  Serial.print(WLsensREAD);
  Serial.print(" Reference: ");
  Serial.println(WLrefREAD);
  
  delay(100);
  
  pHanalog = analogRead(pHanalogPIN);
  Serial.print("pH Analog Raw Reading: ");
  Serial.println(pHanalog);
  float pHmapped = map(pHanalog,0,1023,14,0);
  Serial.print("pH Analog Mapped: ");
  Serial.println(pHmapped);
  pHLM35 = analogRead(pHLM35PIN);
  Serial.print("pH Analog Temperature: ");
  Serial.println(pHLM35);  


  // call sensors.requestTemperatures() to issue a global temperature request to all devices on the bus
  //Serial.print("Requesting temperatures...");
  sensors1.requestTemperatures(); // Send the command to get temperatures
  sensors2.requestTemperatures(); // Send the command to get temperatures
  //Serial.println("DONE");


  // Loop through each device, print out temperature data
  for(int i=0; i<numberOfDevices1; i++)
  {
    // Search the wire for address
    if(sensors1.getAddress(tempDeviceAddress1, i))
    {
      // Output the device ID
      //Serial.print("Water temperature (DS18B20 on pH): ");
      //Serial.println(i,DEC);
      
      // It responds almost immediately. Let's print out the data
      printTemperature1(tempDeviceAddress1); // Use a simple function to print out the data
    } 
  //else ghost device! Check your power requirements and cabling
  }
  
  for(int i=0; i<numberOfDevices2; i++)
  {
    // Search the wire for address
    if(sensors2.getAddress(tempDeviceAddress2, i))
    {
      // Output the device ID
      //Serial.print("Water temperature (pin-12 DS18B20): ");
      //Serial.println(i,DEC);
      
      // It responds almost immediately. Let's print out the data
      printTemperature2(tempDeviceAddress2); // Use a simple function to print out the data
    } 
  //else ghost device! Check your power requirements and cabling
  }
  

  printValues();           //read & print bme280 data
  delay(delayTime);

  
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


  // sensor.measure() returns boolean value
  // - true indicates measurement is completed and success
  // - false indicates that either sensor is not ready or crc validation failed
  //   use getErrorCode() to check for cause of error.

  binFloatState = digitalRead(binFloatPIN);
  if (binFloatState == 1){
    Serial.println("Water level (float): LOW");
  }
  if (binFloatState == 0){
    Serial.println("Water level (float): OKAY");
  }
  
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

float read_temp(void) {    //ENV-TMP temperature-read function
  float v_out;             //voltage output from temp sensor 
  float temp;              //the final temperature is stored here
  digitalWrite(tmpPIN, LOW);   //set pull-up on analog pin
  //digitalWrite(2, HIGH); //set pin 2 high, this will turn on temp sensor
  delay(2);                //wait 2 ms for temp to stabilize
  v_out = analogRead(0);   //read the input pin
  //digitalWrite(2, LOW);  //set pin 2 low, this will turn off temp sensor
  v_out*=.0048;            //convert ADC points to volts (we are using .0048 because this device is running at 5 volts)
  v_out*=1000;             //convert volts to millivolts
  temp= 0.0512 * v_out -20.5128; //the equation from millivolts to temperature
  return temp;             //send back the temp
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

void printValues() {
    Serial.print("Air Temperature (BME280): ");
    Serial.print(bme.readTemperature());
    Serial.println(" *C");

    Serial.print("Air Pressure (BME280): ");

    Serial.print(bme.readPressure() / 100.0F);
    Serial.println(" hPa");

    //Serial.print("Approximate Altitude: ");
    //Serial.print(bme.readAltitude(SEALEVELPRESSURE_HPA));
    //Serial.println(" m");

    Serial.print("Relative Humidity (BME280): ");
    Serial.print(bme.readHumidity());
    Serial.println(" %");

    //Serial.println();
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// function to print the temperatures of Dallas devices
void printTemperature1(DeviceAddress deviceAddress1)
{
  // method 1 - slower
  //Serial.print("Temp C: ");
  //Serial.print(sensors.getTempC(deviceAddress));
  //Serial.print(" Temp F: ");
  //Serial.print(sensors.getTempF(deviceAddress)); // Makes a second call to getTempC and then converts to Fahrenheit

  // method 2 - faster
  float tempC = sensors1.getTempC(deviceAddress1);
  Serial.print("Water Temperature (DS18B20 on pH): ");
  Serial.print(tempC);
  Serial.print(" *C ");
  Serial.println(DallasTemperature::toFahrenheit(tempC)); // Converts tempC to Fahrenheit
}

void printTemperature2(DeviceAddress deviceAddress2)
{
  // method 1 - slower
  //Serial.print("Temp C: ");
  //Serial.print(sensors.getTempC(deviceAddress));
  //Serial.print(" Temp F: ");
  //Serial.print(sensors.getTempF(deviceAddress)); // Makes a second call to getTempC and then converts to Fahrenheit

  // method 2 - faster
  float tempC = sensors2.getTempC(deviceAddress2);
  Serial.print("Water Temperature (pin-12 DS18B20): ");
  Serial.print(tempC);
  Serial.print(" *C ");
  Serial.println(DallasTemperature::toFahrenheit(tempC)); // Converts tempC to Fahrenheit
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// function to print a 1-wire device address
void printAddress(DeviceAddress deviceAddress)
{
  for (uint8_t i = 0; i < 8; i++)
  {
    if (deviceAddress[i] < 16) Serial.print("0");
    Serial.print(deviceAddress[i], HEX);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
