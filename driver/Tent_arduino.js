/*

  Serial format:

  pH: -6.16 | 3071
  EC: 206.53 | 43
  Water Temperature (ENV-TMP): 31.83 *C
  Water Level: 252 Reference: 264
  pH Analog Raw Reading: 754.00
  pH Analog Mapped: 4.00
  pH Analog Temperature: 159.00
  Water Temperature (DS18B20 on pH): 24.00 *C 75.20 *F
  Water Temperature (pin-12 DS18B20): 23.50 *C 74.30 *F
  Air Temperature (BME280): 25.26 *C
  Air Pressure (BME280): 1013.86 hPa
  Relative Humidity (BME280): 49.90 %
  Ambient Light (TSL2561): 69.00 lux
  Water level (float): OKAY
*/


// let data = `pH: -6.16 | 3071
// EC: 206.53 | 43
// Water Temperature (ENV-TMP): 31.83 *C
// Water Level: 252 Reference: 264
// pH Analog Raw Reading: 754.00
// pH Analog Mapped: 4.00
// pH Analog Temperature: 159.00
// Water Temperature (DS18B20 on pH): 24.00 *C 75.20 *F
// Water Temperature (pin-12 DS18B20): 23.50 *C 74.30 *F
// Air Temperature (BME280): 25.26 *C
// Air Pressure (BME280): 1013.86 hPa
// Relative Humidity (BME280): 49.90 %
// Ambient Light (TSL2561): 69.00 lux
// Water level (float): OKAY`;

let temp,
    humidity,
    pressure,
    lux,
    water_level,
    water_temp,
    water_temp_on_ph,
    env_temp,
    ph,
    ec;

// Connects to Arduino nano over USB (serial) and parses repsonse.
const serialport = require('serialport');
const fs = require('fs');

let path = '/dev/serial/by-path/';

fs.readdir(path, function(err, items) {
    for (var i=0; i<items.length; i++) {
        console.log(items[i]);
        // TODO figure out how to differentiate between the two arduinos...
        // For the purpose of the demo we can just hard code it. I imagine the names might change but the order
        // stay in relation to the order they are plugged into the USB port.
        path = path + items[i];
    }

    const portName = process.env.PORT || path;

    console.log(portName);

    const sp = new serialport(portName, {
        baudRate: 9600,
    });

    sp.on('open', function(){
        let string = [];
        sp.on('data', function(input) {
  	        string.push(input.toString());
            // console.log(string.join(""));
            // Make sure we have a complete data entry before we:w parse it.
  	        let regex = /\r\n\r\n/;
  	        if(string.join("").match(regex)) {
  	            let data = string.join("");
                let tempRegEx = /Temperature\s\(BME280\):\s(.+)\s\*/;
                let humRegEx = /Humidity\s\(BME280\):\s(.+)%/;
                let pressureRegEx = /Pressure\s\(BME280\):\s(.+)\sh/;
                let luxRegEx = /Light\s\(TSL2561\):\s(\d+\.?\d+)\s?\(?/;
                let waterTempRegEx = /Temperature\s\(pin-12\sDS18B20\):\s(.+)\s\*C/;
                let waterTempOnPHRegEx = /DS18B20\son\spH\):\s(.+)\s\*C/;
                let phRegEx = /pH:\s(.+)\s\|/;
                let ecRegEx = /EC:\s(.+)\s\|/;
                let envTempRegEx = /ENV-TMP\):\s(.+)\s\*C/;
                let waterLevelRegEx = /Water\slevel\s\(float\):\s(.+)/;

                try {
                    temp = data.match(tempRegEx)[1];
                    humidity = data.match(humRegEx)[1];
                    pressure = data.match(pressureRegEx)[1];
                    lux = data.match(luxRegEx)[1];
                    water_temp = data.match(waterTempRegEx)[1];
                    ph = data.match(phRegEx)[1];
                    ec = data.match(ecRegEx)[1];
                    water_temp_on_ph = data.match(waterTempOnPHRegEx)[1];
                    env_temp = data.match(envTempRegEx)[1];
                    water_level = data.match(waterLevelRegEx)[1];
                } catch (err) {
                    // console.log(err)
                }
                console.log(temp,
                            humidity,
                            pressure,
                            lux,
                            env_temp,
                            water_temp,
                            water_temp_on_ph,
                            ph,
                            ec,
                            water_level);
                string = [];
  	        }
        });
    });
});

