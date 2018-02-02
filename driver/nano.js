"use strict";

// Connects to Arduino nano over USB (serial) and parses repsonse.
const serialport = require('serialport');

// ls /dev/serial/by-path

const portName = process.env.PORT || '/dev/serial/by-path/pci-0000:00:14.0-usb-0:2:1.0-port0';
const sp = new serialport(portName, {
    baudRate: 9600,
});

let temp, humidity, pressure, lux, co2, moist_one, moist_two;

sp.on('open', function(){
  let string = [];
  sp.on('data', function(input) {
  	string.push(input.toString());
    // console.log(string.join(""));
    // Make sure we have a complete data entry before we parse it.
  	let regex = /\r\n\r\n/;
  	if(string.join("").match(regex)) {
  	  let data = string.join("");
  	  let tempRegEx = /Temperature:\s(.+)\*/;
  	  let humRegEx = /Humidity:\s(.+)%/;
      let pressureRegEx = /Pressure:\s(.+)\sh/;
      let luxRegEx = /lux:\s(\d+\.?\d+)\s?\(?/;
      let co2RegEx = /CO2:\s(.+)\sppm/;
      let moist1 = /1:\s(.+)\s%/;
      let moist2 = /2:\s?\n?(.+)\s%/;
      try {
        temp = data.match(tempRegEx)[1];
        humidity = data.match(humRegEx)[1];
        pressure = data.match(pressureRegEx)[1];
        lux = data.match(luxRegEx)[1];
        co2 = data.match(co2RegEx)[1];
        moist_one = data.match(moist1)[1];
        moist_two = data.match(moist2)[1];
      } catch (err) {
        console.log(err)
        // console.log(data)
      }
      console.log(temp, humidity, pressure, lux, co2, moist_one, moist_two);
      string = [];
  	}
  });
});
