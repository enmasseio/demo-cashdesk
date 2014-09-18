var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var argv = require('yargs').argv;
var startServer = argv['server'] !== false;

var simulation = require('./simulation');

if (startServer) {
  // start a server
  var PORT = 3000;
  server.listen(PORT);
  console.log('Server listening on http://localhost:' + PORT);

  app.use('/', express.static(__dirname + '/client'));
  app.use('/node_modules/', express.static(__dirname + '/node_modules'));

  io.on('connection', function (socket) {
    // emit all logs from history
    socket.emit('logs', simulation.logs());
  });

  function broadcast (event, data) {
    // emit to all connected clients
    var connections = io.sockets.connected;
    for (var id in connections) {
      if (connections.hasOwnProperty(id)) {
        connections[id].emit(event, data);
      }
    }
  }

  simulation.on('log', function (log) {
    broadcast('log', log);
  });
}
else {
  // log to the console
  simulation.on('log', function (log) {
    console.log('log', JSON.stringify(log));
  });
}

simulation.start(argv);
