const uuid = process.env.uuid || 'test_device';
const token = process.env.token || '12345678';

const Grow = require('Grow.js');
const raspio = require('raspi-io');
const five = require('johnny-five');
const later = require('later');
const _ = require('underscore');
const spawn = require('child_process').spawn;
const Hs100Api = require('hs100-api');

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
                }
            ],
            actuators: [
                {
                    type: 'relay',
                    state: 'off',
                    name: 'Humidifier',
                    number: 1,
                    role: 'humidifier'
                }
            ]
        },
        humidifier: 'off',
        growfile: {
            targets: {
                humidity: {
                    min: 50,
                    max: 60,
                }
            }
        }
    },

    start: function () {
      console.log('Grow-Hub initialized.');

      var client = new Hs100Api.Client();

      client.startDiscovery().on('plug-new', (plug) => {
        if (plug.name === 'humidifier') {
          console.log('humidifier connected');
          this.humidifier = plug;
          this.humidifier.getInfo().then((data)=> {
            if (data.sysInfo.relay_state === 1) {
              this.set('humidifier', 'on');
            } else {
              this.set('humidifier', 'off');
            }
          });
        }
      });

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

      humidifier_off: function () {
          console.log('Humidifier off');
          if (this.humidifier) {
              this.humidifier.setPowerState(false);
          }
          this.set('humidifier', 'off');
      },

      humidifier_on: function () {
          console.log('Humidifier on');
          if (this.humidifier) {
              this.humidifier.setPowerState(true);
          }
          this.set('humidifier', 'on');
      },

    fire: function () {
      let process = spawn('python', ['python/SHT30.py']);

        process.stdout.on('data', (data)=> {
            data = data.toString().split(' ');
            temperature = Number(data[1]).toFixed(2);
            currentHumidity = Number(data[0]).toFixed(2);
            this.temp_data();
            this.hum_data();
      });
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
