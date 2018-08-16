// Declare variables
let temperature,
    pressure,
    light_data,
    water_temp,
    level,
    level_ref,
    water_level,
    flow_rate_1,
    flow_rate_2,
    water_level_etape,
    humidity,
    altitude,
    bed_temp,
    bed_humidity;

// Connects to Arduino nano over USB (serial) and parses repsonse.
const serialport = require('serialport');
const fs = require('fs');

let path = '/dev/serial/by-path/';

// Read the directory
fs.readdir(path, function(err, items) {
  // We want the first arduino
  path = path + items[0];

  const portName = process.env.PORT || path;

  const sp = new serialport(portName, {
    baudRate: 9600,
  });


  sp.on('open', function(){
    let string = [];
    sp.on('data', function(input) {
  	  string.push(input.toString());
      // Make sure we have a complete data entry before we parse it.
  	  let regex = /\r\n\r\n/;
  	  if(string.join("").match(regex)) {
        let data = string.join("");
        let tempRegEx = /Temperature\s\(BME280\):\s(.+)\*/;
  	    let humRegEx = /Humidity\s\(BME280\):\s(.+)%/;
        let pressureRegEx = /Pressure\s\(BME280\):\s(.+)\sh/;
        let luxRegEx = /Light\s\(TSL2561\):\s(\d+\.?\d+)\s?\(?/;
        let bedTempRegEx = /Temperature\s\(SHT10\):\s(.+)\*/;
  	    let bedHumRegEx = /Humidity\s\(SHT10\):\s(.+)%/;
        let flow_rate_1_Regex= /Flow\sRate\sPump\s1:\s(.+)\sL/;
        let flow_rate_2_Regex = /Flow\sRate\sPump\s2:\s(.+)\sL/;
        let water_level_etape_Regex = /\(eTape\):\s(.+)\s%/;
        let water_level_Regex = /\$(.+)\$/;

        try {
          temperature = Number(data.match(tempRegEx)[1]);
          humidity = Number(data.match(humRegEx)[1]);
          pressure = Number(data.match(pressureRegEx)[1]);
          light_data = Number(data.match(luxRegEx)[1]);
          bed_temp = Number(data.match(bedTempRegEx)[1]);
          bed_humidity = Number(data.match(bedHumRegEx)[1]);
          flow_rate_1 = Number(data.match(flow_rate_1_Regex)[1]);
          flow_rate_2 = Number(data.match(flow_rate_2_Regex)[1]);
          water_level = data.match(water_level_Regex)[1];
          water_level_etape = Number(data.match(water_level_etape_Regex)[1]);
        } catch (err) {
          // console.log(err)
        }
        console.log(temperature,
                    humidity,
                    pressure,
                    light_data,
                    bed_temp,
                    bed_humidity,
                    flow_rate_1,
                    flow_rate_2,
                    water_level,
                    water_level_etape)
  	  }
    });
  });
});
