let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3000;
let serialport = require('serialport');
let fs = require('fs');
let hypercore = require('hypercore');

let feed = hypercore('./data', {valueEncoding: 'utf-8'});
feed.on('ready', ()=> {
    console.log(feed.key);
})

app.get('/', function(req, res){
  res.sendFile(__dirname + '/webcomponent/demo.html');
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

let path = '/dev/serial/by-path/';

let mostRecentLog = 0;

fs.readdir(path, function(err, items) {
    console.log(items);
    for (let i=0; i<items.length; i++) {
        console.log(items[i]);
        path = path + items[i];
    }

    const portName = process.env.PORT || path;
    console.log(portName);

    let sp = new serialport(portName, {
        baudRate: 9600,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false,
        parser: new serialport.parsers.Readline()
    });

    sp.on('open', function(){
        let string = []
        sp.on('data', function(input) {
  	        string.push(input.toString());
  	        // Make sure we have a complete data entry before we parse it.
  	        let regex = /uS\/cm\r\n/;
  	        if(string.join("").match(regex)) {
                let message = string.join('');
                console.log(message);
                feed.append(message, function (err) {
                    if (err) throw err
                    feed.get(mostRecentLog, console.log);
                    mostRecentLog += 1;
                });
  		          let data = string.join("");
  		          let tempRegEx = /Air\sTemperature:\s(.+)\*/;
  		          let humRegEx = /Humidity:\s(.+)%/;
  		          let watertempRegEx = /Water\sTemperature:\s(.+)\*/;
  		          let phRegEx = /pH\sLevel:\s(.+)\r\n/;
  		          let conductivityRegEx = /Conductivity:\s(.+)uS/;

  		          let temp = data.match(tempRegEx)[1];
  		          let humidity = data.match(humRegEx)[1];
  		          let water_temp = data.match(watertempRegEx)[1];
  		          let pH = data.match(phRegEx)[1];
  		          let conductivity = data.match(conductivityRegEx)[1];

	              io.emit('temperature', temp);
	   	          io.emit('humidity', humidity);
	              io.emit('water_temperature', water_temp);
	              io.emit('pH', pH);
	              io.emit('conductivity', conductivity);

    	          string = []
  	        }
        });
    });
});
