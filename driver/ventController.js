const uuid = process.env.uuid || 'SchoolGrow1';
const token = process.env.token || '12345678';

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
    emit_data;

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
      currently: null,
      types: {
        sensors: [
          {
            type: 'temp',
            title: 'Air Temperature',
            icon: 'wi wi-thermometer',
            unit: 'wi wi-celsius',
            max: 40
          },
          {
            type: 'humidity',
            title: 'Humidity',
            icon: 'wi wi-humidity',
            max: 100
          },
          {
            type: 'pressure',
            title: 'Atmospheric pressure',
            icon: 'wi wi-barometer',
            max: 2000
          }
        ],
        actuators: [
          {
            type: 'relay',
            state: 'off',
            name: 'Vent',
            number: 1,
            role: 'vent'
          }
        ]
      },
      vent: 'off',
      growfile: {
        targets: {
          temperature: {
            min: 40,
            open: 85,
            close: 45,
            max: 100,
          }
        }
      }
    },

    start: function () {
      console.log('Grow-Hub initialized.');

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

      this.registerTargets(growfile.targets);

      this.addListener('temperature', (value)=> {
        let temperature = growfile.targets.temperature;
        if (value < temperature.close) {
          this.call('vent_on');
        }
        if (value > temperature.open) {
          this.call('vent_off');
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

    // Set open
    vent_off: function () {
      this.set('vent', 'off');
    },

    vent_on: function () {
      this.set('vent', 'on');
    },

    fire: function () {
      let process = spawn('python', ['python/BME280/read_BME280.py']);

      process.stdout.on('data', (data)=> {
        data = data.toString().split(' ');
        temperature = Number(data[0]).toFixed(2);
        currentHumidity = Number(data[1]).toFixed(2);
        pressure = Number(data[2]).toFixed(2);
        this.temp_data();
        this.hum_data();
        this.pressure_data();
      });
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
    },

    pressure_data: function () {
      if (!_.isUndefined(pressure)) {
        this.emit('pressure', pressure);
        console.log('Air pressure: ' + pressure);
      }
    }
  });
  }, 'data.json');

  GrowHub.connect({
    host: 'grow.commongarden.org',
    port: 443,
    ssl: true
  });
});
