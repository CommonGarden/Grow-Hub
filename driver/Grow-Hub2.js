const uuid = 'greenmeow';
const token = 'greenmeow';

const Grow = require('Grow.js');
const raspio = require('raspi-io');
const five = require('johnny-five');
const later = require('later');
const _ = require('underscore');
const spawn = require('child_process').spawn;
const growfile_example = require('./growfile.json');
const types = require('./types.js');

// Use local time, not UTC.
later.date.localTime();

// Declare variables
let pH_reading,
  temperature,
  currentHumidity,
  pressure,
  eC_reading,
  DO_reading,
  orp_reading,
  emit_data,
  co2,
  moist_one,
  moist_two,
  light_data,
  water_temp,
  fan,
  humidifier,
  light,
  multi,
  level,
  level_ref,
  lux;

let nano = spawn('node', ['nano.js']);

nano.stdout.on('data', (data)=> {
  let parsedData = data.toString().split(" ");
  temperature = parsedData[0];
  currentHumidity = parsedData[2];
  pressure = parsedData[4];
  light_data = parsedData[5];
  co2 = parsedData[6];
  moist_one = parsedData[7];
  moist_two = parsedData[8];
});

// Create a new board object
const board = new five.Board({
  io: new raspio()
});

// When board emits a 'ready' event run this start function.
board.on('ready', function start() {
  let GrowHub = new Grow({
    uuid: uuid,
    token: token,
    component: 'NewHub',
    properties: {
      fan: 'off',
      heater: 'off',
      humidifier: 'off',
      light: 'off',
      duration: 2000,
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
          // console.log(bytes);
          let eC = this.parseAsciiResponse(bytes);
          // console.log(eC);
          if (eC) {
              eC_reading =  eC.split(',')[0];
          }
      });

      board.i2cRead(0x63, 7, (bytes)=> {
        let pH = Number(this.parseAsciiResponse(bytes));
        if (pH) pH_reading = pH;
      });

      let process = spawn('usbrelay');

      // Find all the relays
      process.stdout.on('data', (data)=> {
          let regex = /(.+_.)/;
          let datalist = data.toString().split('\n');
          let i = 1;
          for (let relay of datalist) {
              let match = relay.match(regex);
              if (match) this.set('relay' + i, match[1]);
              i += 1;
          }
      });

      var interval = this.get('interval');
      this.fire();
      emit_data = setInterval(()=>{
        this.fire();
      }, interval);

      let growfile = this.get('growfile');
      this.startGrow(growfile);

      // Turn the fan on or off. Gee, wouldn't it be nice to do this stuff with a gui?
      this.addListener('correction', (key, correction)=> {
        console.log('Key: ' + key + '  Correction: ' + correction);
        let temp_threshold = growfile.temperature_threshold;
        let hum_threshold = growfile.humidity_threshold;
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

        if (key === 'humidity') {
          if (correction > hum_threshold) {
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

        this.addListener('co2', (value)=> {
            if (value < 350) {
                this.call('fan_on');
            }
        })

      this.addListener('lux', (value)=> {
        let threshold = Number(growfile.lux_threshold);
        let timeOfDay = this.get('currently');
        if (value <= threshold) {
          if (timeOfDay === 'day') {
            this.call('light_on');
            this.emit('message', 'Too dark, turning light on');
          }
        } else if (value >= threshold) {
          this.call('light_off');
          this.emit('message', 'Sufficient light, saving energy.')
        }
      });

      this.emit('message', 'Running')
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
      this.co2_data();
      this.water_temp_data();
      this.moisture_data();
    },

    day: function () {
      this.call('light_on');
      this.set('currently', 'day');
      this.emit('message', 'It is now day.');
    },

    night: function () {
      this.call('light_off');
      this.set('currently', 'night');
      this.emit('message', 'It is now night.');
    },

    turn_on: function (type) {
        let types = this.get('types');
        let outlets = types.actuators;
        for (let outlet in outlets) {
            if (outlets[outlet].role === type) {
                this["relay" + outlets[outlet].number + "_on"]();
                console.log(outlets[outlet]);
                // update state of outlet
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
                console.log(outlets[outlet]);
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
      let relay_name = this.get('relay1');
      this.call('on', relay_name);
    },

    relay1_off: function () {
      let relay_name = this.get('relay1');
      this.call('off', relay_name);
    },

    relay2_on: function () {
      let relay_name = this.get('relay2');
      this.call('on', relay_name);
    },

    relay2_off: function () {
      let relay_name = this.get('relay2');
      this.call('off', relay_name);
    },

    relay3_on: function () {
      let relay_name = this.get('relay3');
      this.call('on', relay_name);
    },

    relay3_off: function () {
        let relay_name = this.get('relay3');
        this.call('off', relay_name);
    },

    relay4_on: function () {
        let relay_name = this.get('relay4');
        this.call('on', relay_name);
    },

    relay4_off: function () {
        let relay_name = this.get('relay4');
        this.call('off', relay_name);
    },

    on: function(relay) {
        let process = spawn('usbrelay', [relay + '=1']);
    },

    off: function(relay) {
        let process = spawn('usbrelay', [relay + '=0']);
    },

    ec_data: function () {
      // Request a reading
      board.i2cWrite(0x64, [0x52, 0x00]);

      this.emit('ec', eC_reading);

      console.log('Conductivity: ' + eC_reading);
    },

    ph_data: function () {
      // Request a reading
      board.i2cWrite(0x63, [0x52, 0x00]);

      this.emit('ph', pH_reading);

      console.log('ph: ' + pH_reading);
    },

    water_temp_data: function () {
      let process = spawn('python', ['python/max31865.py']);

      process.stdout.on('data', (data)=> {
          water_temp = data;
      });

      if (!_.isUndefined(water_temp)) {
          this.emit('water_temperature', Number(water_temp));

        console.log('Water Temperature: ' + water_temp);
      }
    },

    co2_data: function () {
        if (!_.isUndefined(co2)) {
            if (!_.isUndefined(co2)) {
                this.emit('co2', co2);

                console.log('CO2 ppm: ' + co2);
            }
        };
    },

    moisture_data: function () {
        if (!_.isUndefined(moist_one) && !_.isUndefined(moist_two)) {
           this.emit('moisture_1', moist_one);
           this.emit('moisture_2', moist_two);
           console.log('Moisture #1: ' + moist_one);
           console.log('Moisture #2: ' + moist_two);
        }
    },

    light_data: function () {
      if (!_.isUndefined(light_data)) {
        this.emit('lux', light_data);

        console.log('Lux: ' + light_data)
      }
    },

    air_pressure_data: function () {
      if (!_.isUndefined(pressure)) {
        this.emit('pressure', pressure);
        console.log('Pressure: ' + pressure);
      }
    },

    temp_data: function () {
      if (!_.isUndefined(temperature)) {
        this.emit('temperature', temperature);
        console.log('Air Temperature: ' + temperature);
      }
    },

    hum_data: function () {
      if (!_.isUndefined(currentHumidity)) {
        this.emit('humidity', currentHumidity);
        console.log('Humidity: ' + currentHumidity);
      }
    }
  }, 'data.json');

  // Clean up on exit, make sure everything is off.
  this.on('exit', function() {
    GrowHub.call('light_off');
    GrowHub.call('fan_off');
    GrowHub.call('humidifier_off');
    GrowHub.call('heater_off');
    GrowHub.call('relay1_off');
    GrowHub.call('relay2_off');
    GrowHub.call('relay3_off');
    GrowHub.call('relay4_off');
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
