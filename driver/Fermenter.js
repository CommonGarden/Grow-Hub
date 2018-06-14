const uuid = 'fermenter';
const token = '12345678';

const Grow = require('Grow.js');
const raspio = require('raspi-io');
const five = require('johnny-five');
const later = require('later');
const _ = require('underscore');
const spawn = require('child_process').spawn;
const growfile_example = require('./growfiles/simple.json');
const types = require('./fermenter_types.js');

// Use local time, not UTC.
later.date.localTime();

// Declare variables
let pH_reading,
  temperature,
  currentHumidity,
  pressure,
  eC_reading,
  emit_data,
  light_data,
  water_temp,
  fan,
  humidifier,
  light,
  multi,
  level,
  level_ref,
  lux,
  nano;

// Kill the nano.js process if it is already running.
// Otherwise USB sensor modules will not reconnect.
spawn('pkill', ['-f', 'node nano.js']);

let parseArduinoData = function () {
  nano = spawn('node', ['nano.js']);

  nano.stdout.on('data', (data)=> {
    try {
      let parsedData = data.toString().split(" ");
      temperature = parsedData[0];
      currentHumidity = parsedData[2];
      pressure = parsedData[4];
      light_data = parsedData[5];
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

      var interval = this.get('interval');
      this.fire();
      emit_data = setInterval(()=>{
        this.fire();
      }, interval);

      let growfile = this.get('growfile');
      this.startGrow(growfile);

      this.addListener('correction', (key, correction)=> {
        // console.log('Key: ' + key + '  Correction: ' + correction);
        let temp_threshold = growfile.temperature_threshold;
        let fan_state = this.get('fan');
        if (key === 'temperature' || key ==='water_temperature') {
          if (correction > temp_threshold) {
            if (fan_state !== 'off') {
              this.call('fan_off');
              this.call('heater_on');
              this.emit('message', 'Too cold, heater on, fan off.');
            }
          } else {
            if (fan_state === 'off') {
              this.call('fan_on');
              this.call('heater_off');
              this.emit('message', 'Too warm, fan on, heater_off.');
            }
          }
        }
      });

      // REDO this control system.
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
        this.emit('water_temperature', water_temp);

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
      if (!_.isUndefined(currentHumidity)) {
        this.emit('humidity', Number(currentHumidity));
        console.log('Humidity: ' + currentHumidity);
      }
    }
  });

  // Clean up on exit, make sure everything is off.
  this.on('exit', function() {
    GrowHub.call('relay1_off');
    GrowHub.call('relay2_off');
    GrowHub.call('relay3_off');
    nano.kill();
  });

  setTimeout(()=> {
    GrowHub.connect({
      host: 'grow.commongarden.org',
      port: 443,
      ssl: true
    });
  }, 2000);
});
