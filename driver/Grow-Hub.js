const Grow = require('./Grow.js');
const raspio = require('raspi-io');
const five = require('johnny-five');
const later = require('later');
const _ = require('underscore');
const spawn = require('child_process').spawn;

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
});

// Create a new board object
const board = new five.Board({
  io: new raspio()
});

// When board emits a 'ready' event run this start function.
board.on('ready', function start() {
  // Define variables
  light = new five.Pin('GPIO26');
  humidifier = new five.Pin('GPIO6');
  fan = new five.Pin('GPIO4');
  heater = new five.Pin('GPIO22');

  let GrowHub = new Grow({
    uuid: 'meow',
    token: 'meow',
    component: 'GrowHubGauges',
    properties: {
      fan: 'off',//1
      light: 'off',//2
      humidifier: 'off',//3
      heater: 'off',
      acid: 'off',
      base: 'off',
      nutrient_a: 'off',
      nutrient_b: 'off',
      duration: 2000,
      interval: 10000,
      currently: null,

      // Hear is an example growfile
      growfile: {
        name: 'Grow',
        batch: '#1',
        temperature_threshold: 50,
        lux_threshold: 10000,
        humidity_threshold: 100,
        ph_threshold: 200,
        ec_threshold: 200,
        // Ratio for nutrients.
        nutrient_a_b_ratio: 0.5,
        targets: {
          water_temperature: {
            min: 17,
            max: 28,
          },

          ph: {
            min: 5.5,
            ideal: 6.0,
            max: 7.0,
            pid: {
              k_p: 200,
              k_i: 0,
              k_d: 100,
              dt: 1
            }
          },

          ec: {
            min: 200,
            ideal: 800,
            max: 1500,
            pid: {
              k_p: 200,
              k_i: 0,
              k_d: 100,
              dt: 1
            }
          }
        },
        cycles: {
          day: {
            targets: {
              temperature: {
                min: 17,
                ideal: 24,
                max: 28,
                pid: {
                  k_p: 200,
                  k_i: 0,
                  k_d: 100,
                  dt: 1
                }
              }
            },
            schedule: 'after 8:00am'
          },
          night: {
            targets: {
              temperature: {
                min: 12,
                ideal: 20,
                max: 26,
                pid: {
                  k_p: 200,
                  k_i: 0,
                  k_d: 100,
                  dt: 1
                }
              }
            },
            schedule: 'after 7:00pm'
          }
        }
      }
    },

    start: function () {
      console.log('Grow-Hub initialized.');

      // This must be called prior to any I2C reads or writes.
      // See Johnny-Five docs: http://johnny-five.io
      board.i2cConfig();

      board.i2cRead(0x64, 32, (bytes)=> {
        let eC = Number(this.parseAsciiResponse(bytes));
        if (eC) eC_reading = eC;
      });

      board.i2cRead(0x63, 7, (bytes)=> {
        let pH = Number(this.parseAsciiResponse(bytes));
        if (pH) pH_reading = pH;
      });

      board.i2cRead(0x66, 7, (bytes)=> {
        let temp = Number(this.parseAsciiResponse(bytes));
        if (temp) water_temp = temp;
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

      this.light_off();
      this.humidifier_off();
      this.fan_off();
      this.heater_off();

      var interval = this.get('interval');

      emit_data = setInterval(()=> {
        this.temp_data();
        this.hum_data();
        this.air_pressure_data();
        this.light_data();
        this.ph_data();
        this.ec_data();
        this.water_temp_data();
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

        let ph_threshold = growfile.ph_threshold;
        let ec_threshold = growfile.ec_threshold;
        if (key === 'ph') {
          if (correction < ph_threshold) {
            this.call('acid');
            this.emit('message', 'Acid pump on.');
          } else {
            this.call('base');
            this.emit('message', 'Base pump on.');
          }
        }
  

        if (key === 'ec') {
          if (correction > ec_threshold) {
            // TODO: need some sort of ratio argument.
            this.call('nutrient_a', correction);
            this.call('nutrient_b', correction);
          } else {
            this.emit('alert', 'Nutrient contents high!') 
          }
        }
      });

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

      // console.log(this);

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

    humidifier_on: function () {
      humidifier.high();
      this.set('humidifier', 'on');
    },

    humidifier_off: function () {
      humidifier.low();
      this.set('humidifier', 'off');
    },

    heater_on: function () {
      heater.high();
      this.set('heater', 'on');
    },

    heater_off: function () {
      heater.low();
      this.set('heater', 'off');
    },

    light_on: function () {
      light.high();
      console.log("light on")
      this.set('light', 'on');
    },

    light_off: function () {
      light.low();
      console.log("light off")
      this.set('light', 'off');
    },

    fan_on: function () {
      fan.high();
      console.log("fan on")
      this.set('fan', 'on');
    },

    fan_off: function () {
      fan.low();
      console.log("fan off")
      this.set('fan', 'off');
    },

    acid: function (duration) {
      if (duration) {
        this.call('relay1_on');
        this.set('acid', 'on');
        setTimeout(()=> {
          this.call('relay1_off');
          this.set('acid', 'off');
          this.relay1_off();
        }, duration);
      }
    },

    base: function (duration) {
      if (duration) {
        this.call('relay2_on');
        this.set('base', 'on');
        setTimeout(()=> {
          this.call('relay2_off');
          this.set('base', 'off');
          this.relay2_off();
        }, duration);
      }
    },

    nutrient_a: function (duration) {
      if (duration) {
        this.call('relay3_on');
        this.set('nutrient_a', 'on');
        setTimeout(()=> {
          this.call('relay3_off');
          this.set('nutrient_a', 'off');
          this.relay3_off();
        }, duration);
      }
    },

    nutrient_b: function (duration) {
      if (duration) {
        this.call('relay4_on');
        this.set('nutrient_b', 'on');
        setTimeout(()=> {
          this.call('relay4_off');
          this.set('nutrient_b', 'off');
          this.relay4_off();
        }, duration);
      }
    },

    relay1_on: function () {
      let relay_name = this.get('relay1');
      this.call('on', relay_name);
      this.set('acid', 'on');
    },

    relay1_off: function () {
      let relay_name = this.get('relay1');
      this.call('off', relay_name);
      this.set('acid', 'off');
    },

    relay2_on: function () {
      let relay_name = this.get('relay2');
      this.call('on', relay_name);
      this.set('base', 'on');
    },

    relay2_off: function () {
      let relay_name = this.get('relay2');
      this.call('off', relay_name);
      this.set('base', 'off');
    },

    relay3_on: function () {
      let relay_name = this.get('relay3');
      this.call('on', relay_name);
      this.set('nutrient_a', 'on');
    },

    relay3_off: function () {
        let relay_name = this.get('relay3');
        this.call('off', relay_name);
        this.set('nutrient_a', 'off');
    },

    relay4_on: function () {
        let relay_name = this.get('relay4');
        this.call('on', relay_name);
        this.set('nutrient_b', 'on');
    },

    relay4_off: function () {
        let relay_name = this.get('relay4');
        this.call('off', relay_name);
        this.set('nutrient_b', 'off');
    },

    on: function(relay) {
        console.log(relay);
        let process = spawn('usbrelay', [relay + '=1']);
    },

    off: function(relay) {
        console.log(relay);
        let process = spawn('usbrelay', [relay + '=0']);
    },

    ec_data: function () {
      // Request a reading, 
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
      board.i2cWrite(0x66, [0x52, 0x00]);

      if (!_.isUndefined(water_temp)) {
        this.emit('water_temperature', water_temp);

        console.log('Temperature: ' + water_temp);
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
        console.log('Temperature: ' + temperature);
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
