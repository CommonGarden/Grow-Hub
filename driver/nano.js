// Connects to Arduino nano over USB (serial) and parses repsonse.
const serialport = require('serialport');
const portName = process.env.PORT || '/dev/serial/';
const sp = new serialport(portName, {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    flowControl: false,
});

sp.on('open', function(){
  let string = []
  sp.on('data', function(input) {
  	string.push(input.toString());
  	// Make sure we have a complete data entry before we parse it.
  	let regex = /\r\n\r\n/;
  	if(string.join("").match(regex)) {
  	  let data = string.join("");
  	  let tempRegEx = /Temperature:\s(.+)\*/;
  	  let humRegEx = /Humidity:\s(.+)%/;
      let pressureRegEx = /Pressure:\s(.+)\sh/;
      let luxRegEx = /lux:\s(.+)\s\(/;
      try {
        let temp = data.match(tempRegEx)[1];
        let humidity = data.match(humRegEx)[1];
        let pressure = data.match(pressureRegEx)[1];
        let lux = data.match(luxRegEx)[1];
        console.log(temp, humidity, pressure, lux);
      } catch (err) {
        console.log(err)
      }
      string = []
  	}
  });
});
