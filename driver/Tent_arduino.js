/*

Serial format:

Water Temperature (ENV-TMP): 49.53
Water Level: 280 Reference: 264
pH Analog Raw Reading: 870.00
pH Analog Mapped: 3.00
pH Analog Temperature: 160.00
Water Temperature (DS18B20 on pH): 24.50 *C 76.10
Water Temperat⸮Locating devices...Found 1 on bus1, and: 1 on bus2.
Parasite power on bus1 is: OFF
Parasite power on bus2 is: OFF
Found device 0 with address: 28FFA47F62160318
Setting resolution to 9
Resolution actually set to: 9
Found device 0 with address: 283BD771040000BD
Setting resolution to 9
Resolution actually set to: 9
pH: 6.66 | 2067
EC: 3918.64 | 105

*/

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

    let temp, humidity, pressure, lux;

    sp.on('open', function(){
        let string = [];
        sp.on('data', function(input) {
  	        string.push(input.toString());
            // console.log(string.join(""));
            // Make sure we have a complete data entry before we:w parse it.
  	        let regex = /\r\n\r\n/;
  	        if(string.join("").match(regex)) {
  	            let data = string.join("");
  	            let tempRegEx = /Temperature:\s(.+)\*/;
  	            let humRegEx = /Humidity:\s(.+)%/;
                let pressureRegEx = /Pressure:\s(.+)\sh/;
                let luxRegEx = /lux:\s(\d+\.?\d+)\s?\(?/;
                try {
                    temp = data.match(tempRegEx)[1];
                    humidity = data.match(humRegEx)[1];
                    pressure = data.match(pressureRegEx)[1];
                    lux = data.match(luxRegEx)[1];
                } catch (err) {
                    // console.log(err)
                }
                console.log(temp, humidity, pressure, lux);
                string = [];
  	        }
        });
    });
});

