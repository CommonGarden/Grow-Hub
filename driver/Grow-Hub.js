const Grow = require('Grow.js');
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
  doser,
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
  doser = new five.Pin('GPIO21');
  fan = new five.Pin('GPIO20');
  heater = new five.Pin('GPIO22');

  let GrowHub = new Grow({
    uuid: 'meow',
    token: 'meow',
    component: 'GrowHub',
    properties: {
      fan: 'off',//1
      light: 'off',//2
      doser: 'off',//3
      heater: 'off',
      duration: 2000,
      interval: 10000,
      threshold: 50,
      lux_threshold: 10000,
      currently: null,

      // Hear is an example growfile
      growfile: {
        name: 'Basil',
        version: '0.1.0', // Not grower tested, any recommendations?
        phases: {
          vegatative: {
            length: '20 days',
            targets: {
              water_temperature: {
                min: 17,
                max: 28,
              },

              ph: {
                min: 5.5,
                max: 7.0,
              },

              ec: {
                min: 200,
                max: 1500
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
        }
      }
    },

    start: function () {
      console.log('Grow-Hub initialized.');

      // This must be called prior to any I2C reads or writes.
      // See Johnny-Five docs: http://johnny-five.io
      board.i2cConfig();

      board.i2cRead(0x64, 32, (bytes)=> {
        let eC = this.parseAtlasTDS(bytes);
        if (eC) eC_reading = eC;
      });

      board.i2cRead(0x63, 7, (bytes)=> {
        let pH = this.parseAtlasPH(bytes);
        if (pH) pH_reading = pH;
      });

      board.i2cRead(0x68, 7, (bytes)=> {
        let temp = Number(this.parseAtlasTemperature(bytes));
        if (temp) water_temp = temp;
      });

      this.light_off();
      this.doser_off();
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
      this.on('correction', (key, correction)=> {
        let threshold = this.get('threshold');
        let fan_state = this.get('fan');
        if (correction > threshold) {
          if (fan_state !== 'off') {
            this.call('fan_off');
            this.emit('message', 'Too cold, fan off.');
          }
        } else {
          if (fan_state === 'off') {
            this.call('fan_on');
            this.emit('message', 'Too warm, fan on.')
          }
        }
      });

      this.on('lux', (value)=> {
        let threshold = Number(this.get('lux_threshold'));
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

    doser_on: function () {
      doser.low();
      this.set('doser', 'on');
    },

    doser_off: function () {
      doser.high();
      this.set('doser', 'off');
    },

    heater_on: function () {
      heater.low();
      this.set('heater', 'on');
    },

    heater_off: function () {
      heater.high();
      this.set('heater', 'off');
    },

    light_on: function () {
      light.low();
      console.log("light on")
      this.set('light', 'on');
    },

    light_off: function () {
      light.high();
      console.log("light off")
      this.set('light', 'off');
    },

    fan_on: function () {
      fan.low();
      this.set('fan', 'on');
    },

    fan_off: function () {
      fan.high();
      this.set('fan', 'off');
    },

    ec_data: function () {
      // Request a reading, 
      board.i2cWrite(0x64, [0x52, 0x00]);

      this.emit('ec', eC_reading);

      console.log('Conductivity: ' + eC_reading);
    },

    orp_data: function () {
      // Request a reading
      board.i2cWrite(0x62, [0x52, 0x00]);

      this.emit('orp', orp_reading);

      console.log('ORP: ' + orp_reading);
    },

    ph_data: function () {
      // Request a reading
      board.i2cWrite(0x63, [0x52, 0x00]);

      this.emit('ph', pH_reading);

      console.log('ph: ' + pH_reading);
    },

    do_data: function () {
      // Request a reading
      board.i2cWrite(0x61, [0x52, 0x00]);

      this.emit('dissolved_oxygen', DO_reading);

      console.log('Dissolved oxygen: ' + DO_reading);
    },

    water_temp_data: function () {
      board.i2cWrite(0x68, [0x52, 0x00]);

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
  });


  // Clean up on exit, make sure everything is off.
  this.on('exit', function() {
    GrowHub.call('light_off');
    GrowHub.call('fan_off');
    GrowHub.call('doser_off');
    GrowHub.call('heater_off');
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
