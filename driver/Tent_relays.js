const five = require('johnny-five');
const fs = require('fs');

// Declare variables
let relay_one,
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

module.exports = relays;
