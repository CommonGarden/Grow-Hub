/////////////////////////////////////////////////////////////////////////////
/*!
  This is a simple example showing how to interface our mini I2C eC interface.
  The usage for this design is very simple, as it uses the MCP3221 I2C ADC. Although actual
  eC calculation is done offboard.
  MinieC can operate from 2.7 to 5.5V to accommodate varying levels of system. Power VCC with 3.3v for a raspi!

  ADC samples at ~28.8KSPS @12bit (4096 steps) and has 8 I2C address of from A0 to A7 (Default A5)
  simply assemble the 2 BYTE registers from the standard I2C read for the raw reading.
  conversion to pH shown in code.

  Sparky's Widgets 2014
  https://www.sparkyswidgets.com/portfolio-item/miniec-i2c-ec-interface/

  I invest a lot of time and resources providing open source hardware, software, and tutorials
  Please help support my efforts by purchasing products from www.sparkyswidgets.com, donating some time
  on documentation or you can even donate some BitCoin to 1NwPNsf6t5vpph6AYY5bg361PSppPSSgDn

  ///////////////////////

  This is a simple example showing how to interface our mini I2C pH interface.
  The usage for this design is very simple, as it uses the MCP3221 I2C ADC. Although actual
  pH calculation is done offboard the analog section is very well laid out giving great results
  at varying input voltages (see vRef for adjusting this from say 5v to 3.3v).
  MinipH can operate from 2.7 to 5.5V to accommodate varying levels of system. Power VCC with 3.3v for a raspi!

  ADC samples at ~28.8KSPS @12bit (4096 steps) and has 8 I2C address of from A0 to A7 (Default A5)
  simply assemble the 2 BYTE registers from the standard I2C read for the raw reading.
  conversion to pH shown in code.

  Note: MinipH has an optional Vref(4.096V) that can be bypassed as well!

  Sparky's Widgets 2012
  http://www.sparkyswidgets.com/Projects/MiniPh.aspx
*/
/////////////////////////////////////////////////////////////////////////////


//I2C Library
#include <Wire.h>
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


//Our pH parameter, for ease of use and eeprom access lets use a struct
struct parameters_H
{
  unsigned int WriteCheck;
  int pH7Cal, pH4Cal;
  float pHStep;
}
  params_ph;

// pH Variables
float pH;
const float vRef = 4.096; //Our vRef into the ADC wont be exact
//Since you can run VCC lower than Vref its
//best to measure and adjust here
const float opampGain = 5.25; //what is our Op-Amps gain (stage 1)


// EC Variables
float eC, temperatute;
const int I2CadcVRef = 4948;
const int oscV = 185; //voltage of oscillator output after voltage divider in millivolts i.e 120mV (measured AC RMS) ideal output is about 180-230mV range
const float kCell = 1.0; //set our Kcell constant basically our microsiemesn conversion 10-6 for 1 10-7 for 10 and 10-5 for .1
const float Rgain = 3000.0; //this is the measured value of the R9 resistor in ohms
const float referenceLow = 279;
const float referenceHigh = 695;

MCP3221 i2cADC(i2cAddress, I2CadcVRef);

void setup()
{
  Wire.begin(); //connects I2C
  Serial.begin(9600);

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
}

void loop()
{
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
  //You can delay or millis here depending on what tasks(others) you may have
  delay(1000);

  //////////////// EC

  Serial.print("EC: ");
  Serial.print(eC);
  Serial.print(" | ");
  Serial.println(adcRaw);
}

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
