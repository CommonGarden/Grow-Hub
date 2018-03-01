const uuid = 'test_device';
const token = '12345678';

const Grow = require('Grow.js');
const raspio = require('raspi-io');
const five = require('johnny-five');
const later = require('later');
const _ = require('underscore');
const spawn = require('child_process').spawn;
const growfile_example = require('./simple-growfile.json');
const types = require('./lite_types.js');

// Use local time, not UTC.
later.date.localTime();

// Declare variables
let pH_reading,
  temperature,
  currentHumidity,
  pressure,
  eC_reading,
  emit_data,
  lux;

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
      this.registerTargets(growfile.targets);

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
          console.log(data.toString());
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
        let ec_process = spawn('python', ['python/eCReader.py']);

        ec_process.stdout.on('data', (data)=> {
            console.log(data.toString());
            eC_reading = data;
        });

        if (eC_reading) {
            this.emit('ec', eC_reading);

            console.log('Conductivity: ' + eC_reading);
        }
    },

    ph_data: function () {
       let ph_process = spawn('python', ['python/pHReader.py']);

       ph_process.stdout.on('data', (data)=> {
           console.log(data.toString());
           pH_reading = data;
       });

       if (pH_reading) {
           this.emit('ph', pH_reading);

           console.log('ph: ' + pH_reading);
        }
    },

    light_data: function () {
      let process = spawn('python', ['python/tsl2561/test.py']);

      process.stdout.on('data', (data)=> {
          console.log(data.toString());
          lux = data;
      });

      if (!_.isUndefined(lux)) {
          this.emit('lux', lux);

          console.log('Lux: ' + lux);
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
