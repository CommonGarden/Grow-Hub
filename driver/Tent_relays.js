const five = require('johnny-five');
const fs = require('fs');

let path = '/dev/serial/by-path/';

// Read the directory, we want the second arduino
path = path + fs.readdirSync(path)[1];

console.log("Opening serial port: " + path);

let board = new five.Board({
    port: path,
    repl: false,
});

let relays = {};

function init (callback) {
    // Assign relays to pins on the NANO
    // We don't run them off the pi becase they require 5V pins
    board.on('ready', function start() {
        relays.relay1 = new five.Pin(6);
        relays.relay2 = new five.Pin(7);
        relays.relay3 = new five.Pin(8);
        relays.relay4 = new five.Pin(9);
    });

    callback(relays);
}

exports.init = init;
