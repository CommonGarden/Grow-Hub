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

*/
/////////////////////////////////////////////////////////////////////////////


//I2C Library
#include <Wire.h>
//We'll want to save calibration and configration information in EEPROM
#include <avr/eeprom.h>
#include <MCP3221.h>
//EEPROM trigger check
#define Write_Check      0x1234

byte i2cAddress = 0x4C; // MCP3221 A5 in Dec 77 A0 = 72 A7 = 79)
						// A0 = x48, A1 = x49, A2 = x4A, A3 = x4B, 
						// A4 = x4C, A5 = x4D, A6 = x4E, A7 = x4F

//Our parameter, for ease of use and eeprom access lets use a struct
struct parameters_T
{
  unsigned int WriteCheck;
  int eCLowCal, eCHighCal;
  float eCStep;
}
params;

float eC, temperatute;
const int I2CadcVRef = 4948;
const int oscV = 185; //voltage of oscillator output after voltage divider in millivolts i.e 120mV (measured AC RMS) ideal output is about 180-230mV range
const float kCell = 1.0; //set our Kcell constant basically our microsiemesn conversion 10-6 for 1 10-7 for 10 and 10-5 for .1
const float Rgain = 3000.0; //this is the measured value of the R9 resistor in ohms

MCP3221 i2cADC(i2cAddress, I2CadcVRef);

void setup()
{
  Wire.begin(); //connects I2C
  Serial.begin(9600);
  //Lets read our Info from the eeprom and setup our params,
  //if we loose power or reset we'll still remember our settings!
  eeprom_read_block(&params, (void *)0, sizeof(params));
  //if its a first time setup or our magic number in eeprom is wrong reset to default
  if (params.WriteCheck != Write_Check){
    reset_Params();
  }
}

void loop()
{
	int adcRaw = i2cADC.getData();
  Serial.println(adcRaw);
  testGetSmoothingMethod();
	calcEc(adcRaw);
}


//Lets read our raw reading while in our lower eC cal solution
void calibrateeCLow(int calnum)
{
  params.eCLowCal = calnum;
  calceCSlope();
  //write these settings back to eeprom
  eeprom_write_block(&params, (void *)0, sizeof(params));
}

//Lets read our raw reading while in our higher eC cal solution
void calibrateeCHigh(int calnum)
{
  params.eCHighCal = calnum;
  calceCSlope();
  //write these settings back to eeprom
  eeprom_write_block(&params, (void *)0, sizeof(params));
}

//This is really the heart of the calibration process
void calceCSlope ()
{
  //RefVoltage * our deltaRawpH / 12bit steps *mV in V / OP-Amp gain /pH step difference 7-4
	params.eCStep = ((((I2CadcVRef*(float)(params.eCLowCal - params.eCHighCal)) / 4095) * 1000));
}


void calcEc(int raw)
{
	float temp, tempmv, tempgain, Rprobe;
	// tempmv = (float)i2cADC.calcMillivolts(raw);
  tempmv =  ((raw / 4095)* I2CadcVRef); //MCP3221 is 12bit datasheet reports a full range of 4095
	tempgain = (tempmv / (float)oscV) - 1.0; // what is our overall gain again so we can cal our probe leg portion
	Rprobe = (Rgain / tempgain); // this is our actually Resistivity
	temp = ((1000000) * kCell) / Rprobe; // this is where we convert to uS inversing so removed neg exponant
	eC = temp / 1000.0; //convert to EC from uS
}

//This just simply applies defaults to the params incase the need to be reset or
//they have never been set before (!magicnum)
void reset_Params(void)
{
  //Restore to default set of parameters!
  params.WriteCheck = Write_Check;
  params.eCLowCal = 200; //assume ideal probe and amp conditions 1/2 of 4096
  params.eCHighCal = 1380; //using ideal probe slope we end up this many 12bit units away on the 4 scale
  eeprom_write_block(&params, (void *)0, sizeof(params)); //write these settings back to eeprom
}

void testGetSmoothingMethod() {
    Serial.print(F("\nSMOOTHING METHOD:\t"));
    switch (mcp3221.getSmoothing()) {
        case (0): Serial.print(F("NO SMOOTHING\n")); break;
        case (1): Serial.print(F("ROLLING-AVERAGE\n")); break;
        case (2): Serial.print(F("EMAVG\n")); break;
    }
}
