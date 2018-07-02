const uuid = 'fermenter';
const token = '12345678';

const Grow = require('Grow.js');
const raspio = require('raspi-io');
const five = require('johnny-five');
const later = require('later');
const _ = require('underscore');
const spawn = require('child_process').spawn;
const growfile_example = require('./growfiles/simple.json');
const types = require('./hydro_garden_types.js');

// Use local time, not UTC.
later.date.localTime();

// Declare variables
let temperature,
  pressure,
  eC_reading,
  pH_reading,
  emit_data,
  camera_interval,
  light_data,
  water_temp,
  fan,
  humidifier,
  level,
  level_ref,
  water_level,
  flow_rate_1,
  flow_rate_2,
  water_level_etape,
  humidity,
  altitude,
  bed_temp,
  bed_humidity,
  nano;

// Kill the nano.js process if it is already running.
// Otherwise USB sensor modules will not reconnect.
spawn('pkill', ['-f', 'node nano.js']);

// Spawns nano.js process which reads values over serial from a USB sensor module
let parseArduinoData = function () {
  nano = spawn('node', ['hydro_garden_arduino.js']);

  nano.stdout.on('data', (data)=> {
    try {
      let parsedData = data.toString().split(" ");
      console.log(parsedData);
      temperature = Number(parsedData[0]);
      humidity = parsedData[2];
      pressure = parsedData[4];
      light_data = parsedData[5];
      bed_temp = parsedData[6];
      bed_humidity = parsedData[7];
      flow_rate_1 = parsedData[8];
      flow_rate_2 = parsedData[9];
      water_level = parsedData[10];
      water_level_etape = parsedData[11];
    } catch (err) {
      console.log(err);
      nano.kill();
    }
  });

  nano.stderr.on('data', (data) => {
    console.log(data.toString());
  });

  nano.on('exit', (data) => {
    parseArduinoData();
  });
}

parseArduinoData();

// Create a new board object
const board = new five.Board({
  io: new raspio()
});

// When board emits a 'ready' event run this start function.
board.on('ready', function start() {
	// Define variables
	outlet_1 = new five.Pin('GPIO26');
	outlet_2 = new five.Pin('GPIO21');
	outlet_3 = new five.Pin('GPIO20');

  outlet_1.high();
  outlet_2.high();
  outlet_3.high();

  let GrowHub = new Grow({
    uuid: uuid,
    token: token,
    component: 'NewHub',
    properties: {
      automation_enabled: true,
      fan: 'off',
      heater: 'off',
      humidifier: 'off',
      light: 'off',
      interval: 10000,
      picture_interval: 100000,
      currently: null,
      types: types,
      growfile: growfile_example
    },

    start: function () {
      console.log('Grow-Hub initialized.');

      // This must be called prior to any I2C reads or writes.
      // See Johnny-Five docs: http://johnny-five.io
      board.i2cConfig();

      board.i2cRead(0x64, 32, (bytes)=> {
          let eC = this.parseAsciiResponse(bytes);
          if (eC) {
              eC_reading =  eC.split(',')[0];
          }
      });

      board.i2cRead(0x63, 7, (bytes)=> {
        let pH = Number(this.parseAsciiResponse(bytes));
        if (pH) pH_reading = pH;
      });

      var picture_interval = this.get('picture_interval');
      camera_interval = setInterval(()=> {
        this.picture();
      }, picture_interval);

      this.picture();

      var interval = this.get('interval');
      this.fire();
      emit_data = setInterval(()=>{
        this.fire();
      }, interval);

      let growfile = this.get('growfile');
      this.startGrow(growfile);

      this.emit('message', 'Running')
    },

    reboot: function () {
      spawn('reboot', ['now'])
    },

    stop: function () {
      this.emit('message', 'Stopped');
      clearInterval(emit_data);
      this.removeAllListeners();
      this.removeTargets();
    },

    restart: function () {
      this.emit('message', 'Restarting');
      this.stop();
      this.start();
    },

    fire: function () {
      this.temp_data();
      this.hum_data();
      this.air_pressure_data();
      this.light_data();
      this.ph_data();
      this.ec_data();
      this.water_temp_data();
      if (!_.isUndefined(bed_temp)) this.emit('bed_temp', bed_temp);
      if (!_.isUndefined(bed_humidity)) this.emit('bed_humidity', bed_humidity);
      if (!_.isUndefined(flow_rate_1)) this.emit('flow_rate_1', flow_rate_1);
      if (!_.isUndefined(flow_rate_2)) this.emit('flow_rate_2', flow_rate_2);
      if (!_.isUndefined(water_level)) this.emit('water_level', water_level);
      if (!_.isUndefined(water_level_etape)) this.emit('water_level_etape', water_level_etape);
      console.log('Bed Temperature: ' + bed_temp);
      console.log('Bed Humidity: '+ bed_humidity);
      console.log('Flow rate 1: ' + flow_rate_1);
      console.log('Flow rate 2: ' + flow_rate_2);
      console.log('Water level: ' + water_level);
      console.log('Water level (etape): ' + water_level_etape);
    },

    turn_on: function (type) {
        let types = this.get('types');
        let outlets = types.actuators;
        for (let outlet in outlets) {
            if (outlets[outlet].role === type) {
                this["relay" + outlets[outlet].number + "_on"]();
                outlets[outlet].state = 'on';
            }
        }
        types.actuators = outlets;
        this.set('types', types);
    },

    turn_off: function (type) {
        let types = this.get('types');
        let outlets = types.actuators;
        for (let outlet in outlets) {
            if (outlets[outlet].role === type) {
                this["relay" + outlets[outlet].number + "_off"]();
                outlets[outlet].state = 'off';
            }
        }
        types.actuators = outlets;
        this.set('types', types);
    },

    humidifier_on: function () {
        this.turn_on('humidifier');
        this.set('humidifier', 'on');
    },

    humidifier_off: function () {
        this.turn_off('humidifier');
        this.set('humidifier', 'off');
    },

    heater_on: function () {
        this.turn_on('heater');
        this.set('heater', 'on');
    },

    heater_off: function () {
        this.turn_off('heater');
        this.set('heater', 'off');
    },

    light_on: function () {
        this.turn_on('light');
        this.set('light', 'on');
    },

    light_off: function () {
        this.turn_off('light');
        this.set('light', 'off');
    },

    fan_on: function () {
        this.turn_on('fan');
        this.set('fan', 'on');
    },

    fan_off: function () {
        this.turn_off('fan');
        this.set('fan', 'off');
    },

    relay1_on: function () {
      outlet_1.low();
    },

    relay1_off: function () {
      outlet_1.high();
    },

    relay2_on: function () {
      outlet_2.low();
    },

    relay2_off: function () {
      outlet_2.high();
    },

    relay3_on: function () {
      outlet_3.low();
    },

    relay3_off: function () {
      outlet_3.high();
    },

    picture: function () {
      let takePic = spawn('raspistill', ['-o', 'image.jpg', '-q', '10'])
      // wait for image to be saved, before reading it.
      setTimeout(()=> {
        fs.readFile('./image.jpg', (err, data) => {
          if (err) {
            console.log(err);
          } else {
            this.sendImage(data);
          }
        });
      }, 3000);
    },

    ec_data: function () {
      // Request a reading
      board.i2cWrite(0x64, [0x52, 0x00]);

      this.emit('ec', Number(eC_reading));

      console.log('Conductivity: ' + eC_reading);
    },

    ph_data: function () {
      // Request a reading
      board.i2cWrite(0x63, [0x52, 0x00]);

      this.emit('ph', Number(pH_reading));

      console.log('ph: ' + pH_reading);
    },

    water_temp_data: function () {
      let process = spawn('python', ['python/max31865.py']);

      process.stdout.on('data', (data)=> {
          water_temp = Number(data);
      });

      if (!_.isUndefined(water_temp)) {
        if (water_temp > 0) {
          this.emit('water_temperature', water_temp);
        }

        console.log('Water Temperature: ' + water_temp);
      }
    },

    light_data: function () {
      if (!_.isUndefined(light_data)) {
        this.emit('lux', Number(light_data));

        console.log('Lux: ' + light_data)
      }
    },

    air_pressure_data: function () {
      if (!_.isUndefined(pressure)) {
        this.emit('pressure', Number(pressure));
        console.log('Pressure: ' + pressure);
      }
    },

    temp_data: function () {
      if (!_.isUndefined(temperature)) {
        this.emit('temperature', Number(temperature));
        console.log('Air Temperature: ' + temperature);
      }
    },

    hum_data: function () {
      if (!_.isUndefined(humidity)) {
        this.emit('humidity', Number(humidity));
        console.log('Humidity: ' + humidity);
      }
    }
  });

  // Clean up on exit, make sure everything is off.
  this.on('exit', function() {
    GrowHub.call('relay1_off');
    GrowHub.call('relay2_off');
    GrowHub.call('relay3_off');
  });

  setTimeout(()=> {
    GrowHub.connect({
      // host: '192.168.1.25'
      host: 'grow.commongarden.org',
      port: 443,
      ssl: true
    });
  }, 2000);
});
