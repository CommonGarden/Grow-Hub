// Connects to Arduino nano over USB (serial) and parses repsonse.
const serialport = require('serialport');
const fs = require('fs');

let path = '/dev/serial/by-path/';

fs.readdir(path, function(err, items) {
  for (var i=0; i<items.length; i++) {
    path = path + items[i];
  }

  const portName = process.env.PORT || path;

  const sp = new serialport(portName, {
    baudRate: 9600,
  });

  let water_level,
      flow_rate_1,
      flow_rate_2,
      water_level_etape_signal,
      water_level_etape_ref,
      temp,
      humidity,
      pressure,
      altitude,
      lux,
      bed_temp,
      bed_humidity;

  sp.on('open', function(){
    let string = [];
    sp.on('data', function(input) {
  	  string.push(input.toString());
      console.log(string.join(""));
      // Make sure we have a complete data entry before we parse it.
  	  let regex = /\r\n\r\n/;
  	  if(string.join("").match(regex)) {
        let data = string.join("");
        // console.log(data);
        let tempRegEx = /Temperature\s\(BME280\):\s(.+)\*/;
  	    let humRegEx = /Humidity\s\(BME280\):\s(.+)%/;
        let pressureRegEx = /Pressure\s\(BME280\):\s(.+)\sh/;
        let luxRegEx = /Light\s\(TSL2561\):\s(\d+\.?\d+)\s?\(?/;
        let bedTempRegEx = /Temperature\s\(SHT10\):\s(.+)\*/;
  	    let bedHumRegEx = /Humidity\s\(SHT10\):\s(.+)%/;
        let flow_rate_1_Regex= /Flow\sRate\sPump\s1:\s(.+)\sL/;
        let flow_rate_2_Regex = /Flow\sRate\sPump\s2:\s(.+)\sL/;
        let water_level_etape_signal_Regex = /Signal:\s(.+)\n/;
        let water_level_etape_ref_Regex = /Reference:\s(.+)\n/;
        let water_level_Regex = /\(float\):\s(.+)\n/;

        try {
          temp = data.match(tempRegEx)[1];
          humidity = data.match(humRegEx)[1];
          pressure = data.match(pressureRegEx)[1];
          lux = data.match(luxRegEx)[1];
          bed_temp = data.match(bedTempRegEx)[1];
          bed_humidity = data.match(bedHumRegEx)[1];
          flow_rate_1 = data.match(flow_rate_1_Regex)[1];
          flow_rate_2 = data.match(flow_rate_2_Regex)[1];
          // water_level = data.match(water_level_Regex)[1];
          // water_level_etape_signal = data.match(water_level_etape_signal_Regex)[1];
          // water_level_etape_ref = data.match(water_level_etape_ref_Regex)[1];
        } catch (err) {
          console.log(err)
        }
        // console.log(temp,
        //             humidity,
        //             pressure,
        //             lux,
        //             bed_temp,
        //             bed_humidity,
        //             flow_rate_1,
        //             flow_rate_2,
        //             water_level,
        //             water_level_etape_signal,
        //             water_level_etape_ref);
        string = [];
  	  }
    });
  });
});

