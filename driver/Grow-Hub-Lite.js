const uuid = 'test_device';
const token = '12345678';

const Grow = require('Grow.js');
const raspio = require('raspi-io');
const five = require('johnny-five');
const later = require('later');
const _ = require('underscore');
const spawn = require('child_process').spawn;
const growfile_example = require('./growfile.json');
const types = require('./lite_types.js');

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

// Create a new board object
const board = new five.Board({
  io: new raspio()
});

let ph_process = spawn('python', ['python/pHReader.py']);
let ec_process = spawn('python', ['python/eCReader.py']);

ph_process.stdout.on('data', (data)=> {
    console.log(data)
});

ec_process.stdout.on('data', (data)=> {
    console.log(data);
});

// When board emits a 'ready' event run this start function.
board.on('ready', function start() {
  let GrowHub = new Grow({
    uuid: uuid,
    token: token,
    component: 'NewHub',
    properties: {
      interval: 10000,
      types: types,
      growfile: growfile_example
    },

    start: function () {
      console.log('Grow-Hub initialized.');

      var interval = this.get('interval');
      this.fire();
      emit_data = setInterval(()=>{
        this.fire();
      }, interval);

      let growfile = this.get('growfile');
      this.startGrow(growfile);

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
      let process = spawn('python', ['python/BME280/read_BME280.py']);

      process.stdout.on('data', (data)=> {
            console.log(data);
            // temperature = data;
            // currentHumidity = data;
            // pressure = data;
            this.temp_data();
            this.hum_data();
            this.air_pressure_data();
      });

      this.light_data();
      this.ph_data();
      this.ec_data();
    },

    ec_data: function () {
        if (eC_reading) {
            this.emit('ec', eC_reading);

            console.log('Conductivity: ' + eC_reading);
        }
    },

    ph_data: function () {
        if (pH_reading) {
            this.emit('ph', pH_reading);

            console.log('ph: ' + pH_reading);
        }
    },

    light_data: function () {
      let process = spawn('python', ['python/tsl2561/test.py']);

      process.stdout.on('data', (data)=> {
          light_data = data;
      });

      if (!_.isUndefined(light_data)) {
        this.emit('lux', light_data)

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

  GrowHub.connect({
      host: 'grow.commongarden.org',
      port: 443,
      ssl: true
  });
});
