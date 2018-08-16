const uuid = 'Dope_Grow_Tent';
const token = '12345678';

const Grow = require('Grow.js');
const raspio = require('raspi-io');
const five = require('johnny-five');
const later = require('later');
const _ = require('underscore');
const spawn = require('child_process').spawn;
const growfile_example = require('./growfiles/simple.json');
const types = require('./Tent_types.js');
const fs = require('fs');

// Use local time, not UTC.
later.date.localTime();

// Declare variables
let temperature,
    currentHumidity,
    pressure,
    outside_temperature,
    outside_humidity,
    outside_pressure,
    pH_reading,
    eC_reading,
    DO_reading,
    orp_reading,
    emit_data,
    light_data,
    water_temp,
    water_temp_on_ph,
    env_temp,
    water_level,
    fan,
    humidifier,
    light,
    nano,
    relay_one,
    relay_two,
    relay_three,
    relay_four,
    relays,
    relays_nano;

let path = '/dev/serial/by-path/';

// Read the directory
fs.readdir(path, (err, items)=> {
    // We want the second arduino
    path = path + items[1];

    relays_nano = new five.Board({
        port: path,
        repl: false,
    });

    // Assign relays to pins on the NANO
    // We don't run them off the pi becase they require 5V pins
    relays_nano.on('ready', function start() {
        relay1 = new five.Pin(6);
        relay2 = new five.Pin(7);
        relay3 = new five.Pin(8);
        relay4 = new five.Pin(9);

        relays = {
            relay1,
            relay2,
            relay3,
            relay4
        };
    });
})

// Kill the nano.js process if it is already running.
// Otherwise USB sensor modules will not reconnect.
spawn('pkill', ['-f', 'node Tent_arduino.js']);

// Spawns nano.js process which reads values over serial from a USB sensor module
let parseArduinoData = function () {
    nano = spawn('node', ['Tent_arduino.js']);

    nano.stdout.on('data', (data)=> {
        try {
            let parsedData = data.toString().split(" ");
            temperature = parsedData[0];
            currentHumidity = parsedData[1];
            pressure = parsedData[3];
            light_data = parsedData[4];
            env_temp = parsedData[5];
            water_temp = parsedData[6];
            water_temp_on_ph = parsedData[7];
            pH_reading = parsedData[8];
            eC_reading = parsedData[9];
            water_level = parsedData[10];
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
    io: new raspio(),
    repl: false
});

// When board emits a 'ready' event run this start function.
board.on('ready', function start() {
    let GrowHub = new Grow({
        uuid: uuid,
        token: token,
        properties: {
            automation_enabled: true,
            fan: 'off',
            heater: 'off',
            humidifier: 'off',
            light: 'off',
            duration: 2000,
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

            board.i2cRead(0x61, 14, (bytes)=> {
                let DO = this.parseAsciiResponse(bytes);
                if (DO) DO_reading =  DO;
            });

            board.i2cRead(0x62, 14, (bytes)=> {
                let ORP = Number(this.parseAsciiResponse(bytes));
                if (ORP) orp_reading = ORP;
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

            // Wait to start Growfile
            setTimeout(()=> {
                this.startGrow(growfile);
            }, 5000);

            // this.on('correction', (key, correction)=> {
            //     console.log(key, correction);
            //     if (key === 'temerature') {
            //         // Handle temperature control
            //     }

            //     if (key === 'humidity') {
            //         // Handle humidity control
            //     }
            // });

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
            let process = spawn('python', ['python/BME280/read_BME280.py']);

            process.stdout.on('data', (data)=> {
                data = data.toString().split(' ');
                outside_temperature = Number(data[0]).toFixed(2);
                outside_humidity = Number(data[1]).toFixed(2);
                outside_pressure = Number(data[2]).toFixed(2);
                this.emit('outside_temperature', outside_temperature);
                this.emit('outside_humidity', outside_humidity);
                this.emit('outside_pressure', outside_pressure);
                console.log('External temperature: ' + outside_temperature);
                console.log('External humidity: ' + outside_humidity);
                console.log('External pressure: ' + outside_pressure);
            });

            if (water_level) this.emit('water_level', water_level);
            if (env_temp) this.emit('env_temp', env_temp);
            if (water_temp) this.emit('water_temperature', water_temp);
            if (water_temp_on_ph) this.emit('water_temp_on_ph', water_temp_on_ph);

            console.log("Water temperature: " + water_temp);
            console.log("Water temperature: " + water_temp_on_ph);
            console.log("Water level: " +  water_level);
            console.log("Env temperature: " + env_temp);


            this.temp_data();
            this.hum_data();
            this.air_pressure_data();
            this.light_data();
            this.orp_data();
            this.do_data();
            this.ph_data();
            this.ec_data();
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
            this.call('on', 'relay1');
        },

        relay1_off: function () {
            this.call('off', 'relay1');
        },

        relay2_on: function () {
            this.call('on', 'relay2');
        },

        relay2_off: function () {
            this.call('off', 'relay2');
        },

        relay3_on: function () {
            this.call('on', 'relay3');
        },

        relay3_off: function () {
            this.call('off', 'relay3');
        },

        relay4_on: function () {
            this.call('on', 'relay4');
        },

        relay4_off: function () {
            this.call('off', 'relay4');
        },

        on: function(relay) {
            relays[relay].low();
        },

        off: function(relay) {
            relays[relay].high();
        },

        orp_data: function() {
            board.i2cWrite(0x62, [0x52, 0x00]);

            this.emit('orp', Number(orp_reading));

            console.log('ORP: ' + orp_reading);
        },

        do_data: function (){
            board.i2cWrite(0x61, [0x52, 0x00]);

            this.emit('do', Number(DO_reading));

            console.log('Dissolved oxygen: ' + DO_reading);
        },

        ec_data: function () {
            // Request a reading
            // board.i2cWrite(0x64, [0x52, 0x00]);
            if (eC_reading) this.emit('ec', Number(eC_reading));

            console.log('Conductivity: ' + eC_reading);
        },

        ph_data: function () {
            // Request a reading
            // board.i2cWrite(0x63, [0x52, 0x00]);
            if (pH_reading) this.emit('ph', Number(pH_reading));

            console.log('ph: ' + pH_reading);
        },

        water_temp_data: function () {
            let process = spawn('python', ['python/max31865.py']);

            process.stdout.on('data', (data)=> {
                water_temp = Number(data) * 1.8 + 32;
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
    }, 'data.json');

    // Clean up on exit, make sure everything is off.
    this.on('exit', function() {
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
