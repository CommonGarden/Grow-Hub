const uuid = process.env.uuid || 'test_device';
const token = process.env.token || '12345678';

const Grow = require('Grow.js');
const raspio = require('raspi-io');
const five = require('johnny-five');
const later = require('later');
const _ = require('underscore');
const spawn = require('child_process').spawn;
const NodeWebcam = require( 'node-webcam' );
const fs = require('fs');

const opts = {
  width: 1280,
  height: 720,
  delay: 0,
  quality: 100,
  output: 'jpeg',
  verbose: true
}

// Use local time, not UTC.
later.date.localTime();

// Declare variables
let temperature,
    currentHumidity,
    pressure,
    emit_data,
    camera_interval;

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
      picture_interval: 100000,
      types: {
        camera: true,
        sensors: [
          {
            type: 'temp',
            title: 'Air Temperature',
            icon: 'wi wi-thermometer',
            unit: 'wi wi-celsius',
          },
          {
            type: 'humidity',
            title: 'Humidity',
            icon: 'wi wi-humidity',
          }
        ]
      },
      growfile: {
        targets: {
          temperature: {
            min: 50,
            max: 90
          },
          humidity: {
            min: 50,
            max: 60,
          }
        }
      }
    },

    start: function () {
      console.log('Grow-Hub initialized.');

      var interval = this.get('interval');
      var picture_interval = this.get('picture_interval');

      this.fire();
      emit_data = setInterval(()=>{
        this.fire();
      }, interval);

      camera_interval = setInterval(()=> {
        this.picture();
      }, picture_interval);

      let growfile = this.get('growfile');
      this.registerTargets(growfile.targets);
    },

    stop: function () {
      this.emit('message', 'Stopped');
      clearInterval(emit_data);
      clearInterval(camera_interval);
      this.removeAllListeners();
      this.removeTargets();
    },

    restart: function () {
      this.emit('message', 'Restarting');
      this.stop();
      this.start();
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

    picture: function () {
      NodeWebcam.capture( 'image', opts, ( err, data )=> {
        if ( !err ) console.log( 'Image created!' );
        fs.readFile('./' + data, (err, data) => {
          if (err) throw err; // Fail if the file can't be read.
          this.sendImage(data);
        });
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
  });

  GrowHub.connect({
      host: 'grow.commongarden.org',
      port: 443,
      ssl: true
  });
});
