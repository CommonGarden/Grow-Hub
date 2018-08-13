Welcome To: MinieC Basic Example Firmware!!
================================

##### Note: This is for the MinieC Hardware Version 1.1+ Branch

This is the base example sketch for using MinieC hardware. The usage is quite straight forward :sunglasses:.
MinieC digitizes the analog voltage from the eC AFE using an I2C ADC.

Adding eC Sensors has never been easier
-------------------------

Using MinieC with any project is extremely easy, the MCP3221 is a very popular ADC which is easy to work with whether you use Arduino or any other method, even BitBanging over a FTDI USB to Serial!

Please see [MinieC's Project page](http://www.sparkyswidgets.com/portfolio-item/miniec-i2c-ec-interface/) for more information!
<http://www.sparkyswidgets.com/portfolio-item/miniec-i2c-ec-interface/>

Whats in the firmware?
-------------------------

Not too Much really! The flow is very straight forward. Set up our I2C (2Wire, Aka "Wire") interface assign the address of our ADC.
Then we can ask it for its MSB and LSBs, put them together to form the 12 bit reading back and bobs your uncle :aus:

Installation Info
-------------------------

The best part of this design and firmware is nothing extra to install. copy paste, clone whatever you method all you need is similar hardware and this code!!

Basic Usage
-------------------------

This is an initial alpha that will give raw values without calibration. Although A revision with temp compensated calibration is in the pipeline(Using mapping between known standard solutions)

sage of MinieC example code is very easy. As of now you read the peak off the output and form a linear map based off a one or 2 point calibration at each Kprobe level that will be used. a simple set of equations based on this map will give you the eC/TDS and Salinity(of specific salts). SUT is treated as an unknown conductance/ohms) and is one tap of a op-amp gain voltage divider. Some useful conversions; G=(Vout/Vin)-1 and R = Rf/G, R = 1/eC*E-X where X is conversion to micro siemens based on probe K cell constant. I.E KCell 1 (1uS/cm) is 1E-6, K10 1E-7 and .1 is 1E-5. conductance 1/ohms and PPM=eC*500.

####Some of the commands are:
- I : Calibration and general Info dump


Hardware: Schematics and Layouts
-------------------------

- Take a look in [MinieC's Hardware Repo](https://github.com/SparkysWidgets/MinieCHW) for the EAGLE files!
- Check out my Isolated ISE interface[IsoIon](http://www.sparkyswidgets.com/portfolio-item/ion-selective-electrode-interface) for a powerful and easy to use USB PH Probe interface!


License Info
-------------------------

<p>This is a fully open source project released under the CC BY license</p>
<a rel="license" href="http://creativecommons.org/licenses/by-sa/3.0/deed.en_US"><img alt="Creative Commons License" style="border-width: 0px;" src="http://i.creativecommons.org/l/by-sa/3.0/88x31.png" /></a><br />
<span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">MinieC</span> by <a xmlns:cc="http://creativecommons.org/ns#" href="www.sparkyswidgets.com" property="cc:attributionName" rel="cc:attributionURL">Ryan Edwards, Sparky's Widgets</a> is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/3.0/deed.en_US">Creative Commons Attribution-ShareAlike 3.0 Unported License</a>.<br />
Based on a work at <a xmlns:dct="http://purl.org/dc/terms/" href="/portfolio-item/miniec-i2c-ec-interface/" rel="dct:source">http://www.sparkyswidgets.com/portfolio-item/miniec-i2c-ec-interface/</a>