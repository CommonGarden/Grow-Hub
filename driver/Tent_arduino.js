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

