//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ENV-TMP (analog pin A0) //// TO ADD: //// WLSENS (eTape) (analog pins A2,A3)
//(10' 22/4 cable) BME280 (i2c pins A4,A5) TSL2561 (i2c pins A4,A5) pH (analog
//pH out (Po) pin A6, analog temp out (T1) pin A7, digital temp DS18B20 (T2) pin
//10) float sensor (binary hi-lo) (digital read pin 2) DS18B20 (1-wire pin 12)
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#include <Wire.h>

#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_TSL2561_U.h>

#include <SoftwareSerial.h>      //we have to include the SoftwareSerial library, or else we can't use it

#include <OneWire.h>
#include <DallasTemperature.h>

//We'll want to save calibration and configration information in EEPROM
#include <avr/eeprom.h>
#include <MCP3221.h>
//EEPROM trigger check
#define Write_Check      0x1234

// MCP3221 A5 in Dec 77 A0 = 72 A7 = 79)
// A0 = x48, A1 = x49, A2 = x4A, A3 = x4B,
// A4 = x4C, A5 = x4D, A6 = x4E, A7 = x4F

// pH address
#define ADDRESS 0x48

// pH Variables
float pH;
const float vRef = 4.096; //Our vRef into the ADC wont be exact
//Since you can run VCC lower than Vref its
//best to measure and adjust here
const float opampGain = 5.25; //what is our Op-Amps gain (stage 1)

//Our pH parameter, for ease of use and eeprom access lets use a struct
struct parameters_H
{
  unsigned int WriteCheck;
  int pH7Cal, pH4Cal;
  float pHStep;
}
  params_ph;

// EC Variables
// EC address
byte i2cAddress = 0x4C;

//Our EC parameter, for ease of use and eeprom access lets use a struct
struct parameters_T
{
  unsigned int WriteCheck;
  int eCLowCal, eCHighCal;
  float eCStep;
}
  params_ec;

float eC, temperatute;
const int I2CadcVRef = 4948;
const int oscV = 185; //voltage of oscillator output after voltage divider in millivolts i.e 120mV (measured AC RMS) ideal output is about 180-230mV range
const float kCell = 1.0; //set our Kcell constant basically our microsiemesn conversion 10-6 for 1 10-7 for 10 and 10-5 for .1
const float Rgain = 3000.0; //this is the measured value of the R9 resistor in ohms
const float referenceLow = 279;
const float referenceHigh = 695;

MCP3221 i2cADC(i2cAddress, I2CadcVRef);


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
  Wire.begin(); //connects I2C
  Serial.begin(9600); //set up the hardware serial port to run at 9600

  //Lets read our Info from the eeprom and setup our params,
  //if we loose power or reset we'll still remember our settings!
  //first we load EC params
  eeprom_read_block(&params_ec, (void *)1, sizeof(params_ec));

  //then pH param
  eeprom_read_block(&params_ph, (void *)0, sizeof(params_ph));

  //if its a first time setup or our magic number in eeprom is wrong reset to default
  if (params_ec.WriteCheck != Write_Check){
    reset_EC_Params();
  }
  if (params_ph.WriteCheck != Write_Check){
    reset_PH_Params();
  }

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

  //Serial.println(F("BME280 test"));
  bool status;
  // default settings
  // (you can also pass in a Wire library object like &Wire2)
  status = bme.begin();     // keep??
  if (!status) {
      Serial.println("Could not find a valid BME280 sensor, check wiring!");
      while (1);
  }

  // Start up the Dallas library
  sensors1.begin();
  sensors2.begin();

  // Grab a count of devices on the wire
  numberOfDevices1 = sensors1.getDeviceCount();
  numberOfDevices2 = sensors2.getDeviceCount();

  // locate devices on the bus
  /* Serial.print("Locating devices..."); */

  /* Serial.print("Found "); */
  /* Serial.print(numberOfDevices1, DEC); */
  /* Serial.print(" on bus1, and: "); */
  /* Serial.print(numberOfDevices2, DEC); */
  /* Serial.println(" on bus2."); */

  /* // report parasite power requirements */
  /* Serial.print("Parasite power on bus1 is: "); */
  /* if (sensors1.isParasitePowerMode()) Serial.println("ON"); */
  /* else Serial.println("OFF"); */

  /* Serial.print("Parasite power on bus2 is: "); */
  /* if (sensors2.isParasitePowerMode()) Serial.println("ON"); */
  /* else Serial.println("OFF"); */

  // Loop through each device, print out address
  for(int i=0;i<numberOfDevices1; i++)
  {
      // Search the wire for address
      if(sensors1.getAddress(tempDeviceAddress1, i))
      {
        /* Serial.print("Found device "); */
        /* Serial.print(i, DEC); */
        /* Serial.print(" with address: "); */
        /* printAddress(tempDeviceAddress1); */
        /* Serial.println(); */

        /* Serial.print("Setting resolution to "); */
        /* Serial.println(TEMPERATURE_PRECISION1, DEC); */

        // set the resolution to TEMPERATURE_PRECISION bit (Each Dallas/Maxim device is capable of several different resolutions)
        sensors1.setResolution(tempDeviceAddress1, TEMPERATURE_PRECISION1);

        /* Serial.print("Resolution actually set to: "); */
        /* Serial.print(sensors1.getResolution(tempDeviceAddress1), DEC); */
        /* Serial.println(); */
      }else{
        /* Serial.print("Found ghost device at "); */
        /* Serial.print(i, DEC); */
        /* Serial.print(" but could not detect address. Check power and cabling"); */
      }
  }
  // Loop through each device, print out address
  for(int i=0;i<numberOfDevices2; i++)
  {
      // Search the wire for address
      if(sensors2.getAddress(tempDeviceAddress2, i))
      {
        /* Serial.print("Found device "); */
        /* Serial.print(i, DEC); */
        /* Serial.print(" with address: "); */
        /* printAddress(tempDeviceAddress2); */
        /* Serial.println(); */

        /* Serial.print("Setting resolution to "); */
        /* Serial.println(TEMPERATURE_PRECISION2, DEC); */

        // set the resolution to TEMPERATURE_PRECISION bit (Each Dallas/Maxim device is capable of several different resolutions)
        sensors2.setResolution(tempDeviceAddress2, TEMPERATURE_PRECISION2);

        /* Serial.print("Resolution actually set to: "); */
        /* Serial.print(sensors2.getResolution(tempDeviceAddress2), DEC); */
        /* Serial.println(); */
      }else{
        /* Serial.print("Found ghost device at "); */
        /* Serial.print(i, DEC); */
        /* Serial.print(" but could not detect address. Check power and cabling"); */
      }
  }


}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////


void loop() {

  delay(1000);              //wait 1000ms before we do it again

  // Read pH data
  //This is our I2C ADC interface section
  //We'll assign 2 BYTES variables to capture the LSB and MSB(or Hi Low in this case)
  byte adc_high;
  byte adc_low;
  //We'll assemble the 2 in this variable
  int adc_result;
  Wire.requestFrom(ADDRESS, 2);        //requests 2 bytes
  while(Wire.available() < 2);         //while two bytes to receive
  //Set em
  adc_high = Wire.read();
  adc_low = Wire.read();
  //now assemble them, remembering our byte maths a Union works well here as well
  adc_result = (adc_high * 256) + adc_low;
  //We have a our Raw pH reading fresh from the ADC now lets figure out what the pH is
  calcpH(adc_result);

  // Read raw EC Data
	int adcRaw = i2cADC.getData();
	calcEc(adcRaw);

  //Lets handle any commands here otherwise if we do prior to a fresh ADC reading
  //may end up calibrate to slightly older data (this really might not matter, handle as you will)
  if(Serial.available())
    {
      char c = Serial.read();
      if(c == 'C') {
        //Which range?
        int calrange;
        calrange = Serial.parseInt();
        Serial.println(calrange);
        if( calrange == 4 ) calibratepH4(adc_result);
        if( calrange == 7 ) calibratepH7(adc_result);
      }

      if (c == 'E') {
        //Which range?
        int calrange;
        calrange = Serial.parseInt();
        if( calrange = 0) calibrateeCLow(adcRaw);
        if( calrange = 1) calibrateeCHigh(adcRaw);
      }

      if(c == 'I') {
        //Lets read in our parameters and spit out the pH info!
        eeprom_read_block(&params_ph, (void *)0, sizeof(params_ph));
        Serial.print("pH 7 cal: ");
        Serial.print(params_ph.pH7Cal);
        Serial.print(" | ");
        Serial.print("pH 4 cal: ");
        Serial.print(params_ph.pH4Cal);
        Serial.print(" | ");
        Serial.print("pH probe slope: ");
        Serial.println(params_ph.pHStep);

        /* // Lets read in our parameters and spit out the EC info! */
        eeprom_read_block(&params_ec, (void *)1, sizeof(params_ec));
        Serial.print("EC low cal: ");
        Serial.print(params_ec.eCLowCal);
        Serial.print(" | ");
        Serial.print("EC high cal: ");
        Serial.print(params_ec.eCHighCal);
        Serial.print(" | ");
        Serial.print("EC probe slope: ");
        Serial.println(params_ec.eCStep);
      }
    }
  //Spit out some debugging/Info to show what our pH and raws are
  Serial.print("pH: ");
  Serial.print(pH);
  Serial.print(" | ");
  Serial.println(adc_result);

  //////////////// EC
  Serial.print("EC: ");
  Serial.print(eC);
  Serial.print(" | ");
  Serial.println(adcRaw);

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


  /* // call sensors.requestTemperatures() to issue a global temperature request to all devices on the bus */
  /* sensors1.requestTemperatures(); // Send the command to get temperatures */
  /* sensors2.requestTemperatures(); // Send the command to get temperatures */

  /* // Loop through each device, print out temperature data */
  /* for(int i=0; i<numberOfDevices1; i++) */
  /* { */
  /*   // Search the wire for address */
  /*   if(sensors1.getAddress(tempDeviceAddress1, i)) */
  /*   { */
  /*     // Output the device ID */
  /*     //Serial.print("Water temperature (DS18B20 on pH): "); */
  /*     //Serial.println(i,DEC); */

  /*     // It responds almost immediately. Let's print out the data */
  /*     printTemperature1(tempDeviceAddress1); // Use a simple function to print out the data */
  /*   } */
  /* //else ghost device! Check your power requirements and cabling */
  /* } */

  /* for(int i=0; i<numberOfDevices2; i++) */
  /* { */
  /*   // Search the wire for address */
  /*   if(sensors2.getAddress(tempDeviceAddress2, i)) */
  /*   { */
  /*     // Output the device ID */
  /*     //Serial.print("Water temperature (pin-12 DS18B20): "); */
  /*     //Serial.println(i,DEC); */

  /*     // It responds almost immediately. Let's print out the data */
  /*     printTemperature2(tempDeviceAddress2); // Use a simple function to print out the data */
  /*   } */
  /* //else ghost device! Check your power requirements and cabling */
  /* } */

  Serial.print("Air Temperature (BME280) = ");
  Serial.print(bme.readTemperature());
  Serial.println(" *C");

  Serial.print("Air Pressure (BME280) = ");

  Serial.print(bme.readPressure() / 100.0F);
  Serial.println(" hPa");

  //Serial.print("Approximate Altitude = ");
  //Serial.print(bme.readAltitude(SEALEVELPRESSURE_HPA));
  //Serial.println(" m");

  Serial.print("Relative Humidity (BME280) = ");
  Serial.print(bme.readHumidity());
  Serial.println(" %");

  /* printValues();           //read & print bme280 data */
  /* delay(delayTime); */


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
    Serial.print("Air Temperature (BME280) = ");
    Serial.print(bme.readTemperature());
    Serial.println(" *C");

    Serial.print("Air Pressure (BME280) = ");

    Serial.print(bme.readPressure() / 100.0F);
    Serial.println(" hPa");

    //Serial.print("Approximate Altitude = ");
    //Serial.print(bme.readAltitude(SEALEVELPRESSURE_HPA));
    //Serial.println(" m");

    Serial.print("Relative Humidity (BME280) = ");
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
//////////////////////////////////////////////////////////////////////
// EC functions
//Lets read our raw reading while in our lower eC cal solution
void calibrateeCLow(int calnum)
{
  params_ec.eCLowCal = calnum;
  calceCSlope();
  //write these settings back to eeprom
  eeprom_write_block(&params_ec, (void *)1, sizeof(params_ec));
}

//Lets read our raw reading while in our higher eC cal solution
void calibrateeCHigh(int calnum)
{
  params_ec.eCHighCal = calnum;
  calceCSlope();
  //write these settings back to eeprom
  eeprom_write_block(&params_ec, (void *)1, sizeof(params_ec));
}

//This is really the heart of the calibration process
void calceCSlope ()
{
  //RefVoltage * our deltaRawpH / 12bit steps *mV in V / OP-Amp gain / reference solution difference
  // TODO add reference solution difference
	params_ec.eCStep = ((((I2CadcVRef*(float)(params_ec.eCLowCal - params_ec.eCHighCal)) / 4095) * 1000));
}

void calcEc(int raw)
{
	/* float temp, tempmv, tempgain, Rprobe; */
	/* // tempmv = (float)i2cADC.calcMillivolts(raw); */
  /* //  tempmv =  ((raw / 4095)* I2CadcVRef); //MCP3221 is 12bit datasheet reports a full range of 4095 */
  /* //	tempgain = (tempmv / (float)oscV) - 1.0; // what is our overall gain again so we can cal our probe leg portion */
  /* tempgain = (raw / (float)oscV); // modified from the above */
	/* Rprobe = (Rgain / tempgain); // this is our actually Resistivity */
	/* temp = ((1000000) * kCell) / Rprobe; // this is where we convert to uS inversing so removed neg exponant */
	/* eC = temp / 1000.0; //convert to EC from uS */

  float value;
  float SW_condK;
  float SW_condOffset;

  // Calculates the cell factor of the conductivity sensor and the offset from the calibration values
  SW_condK = referenceLow * referenceHigh * ((params_ec.eCLowCal - params_ec.eCHighCal) / (referenceHigh - referenceLow));
  SW_condOffset = (referenceLow * params_ec.eCLowCal - referenceHigh*params_ec.eCHighCal) / (referenceHigh - referenceLow);

  // Converts the resistance of the sensor into a conductivity value
  eC = SW_condK * 1 / (raw + SW_condOffset);
}

//This just simply applies defaults to the params incase the need to be reset or
//they have never been set before (!magicnum)
void reset_EC_Params(void)
{
  //Restore to default set of parameters!
  params_ec.WriteCheck = Write_Check;
  params_ec.eCLowCal = 60; //assume ideal probe and amp conditions 1/2 of 4096
  params_ec.eCHighCal = 89; //using ideal probe slope we end up this many 12bit units away on the 4 scale
  eeprom_write_block(&params_ec, (void *)1, sizeof(params_ec)); //write these settings back to eeprom
}

//////////////////////////////////////////////////////////////////////
// PH functions

//Lets read our raw reading while in pH7 calibration fluid and store it
//We will store in raw int formats as this math works the same on pH step calcs
void calibratepH7(int calnum)
{
  params_ph.pH7Cal = calnum;
  calcpHSlope();
  //write these settings back to eeprom
  eeprom_write_block(&params_ph, (void *)0, sizeof(params_ph));
}

//Lets read our raw reading while in pH4 calibration fluid and store it
//We will store in raw int formats as this math works the same on pH step calcs
//Temperature compensation can be added by providing the temp offset per degree
//IIRC .009 per degree off 25c (temperature-25*.009 added pH@4calc)
void calibratepH4(int calnum)
{
  params_ph.pH4Cal = calnum;
  calcpHSlope();
  //write these settings back to eeprom
  eeprom_write_block(&params_ph, (void *)0, sizeof(params_ph));
}

//This is really the heart of the calibration process, we want to capture the
//probes "age" and compare it to the Ideal Probe, the easiest way to capture two readings,
//at known point(4 and 7 for example) and calculate the slope.
//If your slope is drifting too much from ideal (59.16) its time to clean or replace!
void calcpHSlope ()
{
  //RefVoltage * our deltaRawpH / 12bit steps *mV in V / OP-Amp gain /pH step difference 7-4
  params_ph.pHStep = ((((vRef*(float)(params_ph.pH7Cal - params_ph.pH4Cal))/4096)*1000)/opampGain)/3;
}

//Now that we know our probe "age" we can calculate the proper pH Its really a matter of applying the math
//We will find our millivolts based on ADV vref and reading, then we use the 7 calibration
//to find out how many steps that is away from 7, then apply our calibrated slope to calculate real pH
void calcpH(int raw)
{
  float miliVolts = (((float)raw/4096)*vRef)*1000;
  float temp = ((((vRef*(float)params_ph.pH7Cal)/4096)*1000)- miliVolts)/opampGain;
  pH = 7-(temp/params_ph.pHStep);
}

//This just simply applies defaults to the params in case the need to be reset or
//they have never been set before (!magicnum)
void reset_PH_Params(void)
{
  //Restore to default set of parameters!
  params_ph.WriteCheck = Write_Check;

  /* // IDEAL PROBE */
  /* params_ph.pH7Cal = 2048; //assume ideal probe and amp conditions 1/2 of 4096 */
  /* params_ph.pH4Cal = 1286; //using ideal probe slope we end up this many 12bit units away on the 4 scale */
  /* params_ph.pHStep = 59.16;//ideal probe slope */
  // Our probe
  params_ph.pH7Cal = 2040;
  params_ph.pH4Cal = 2274;
  params_ph.pHStep = -14.92;
  eeprom_write_block(&params_ph, (void *)0, sizeof(params_ph)); //write these settings back to eeprom
}
