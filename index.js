var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var simulation = require('./simulation');

// start a server
var PORT = 3000;
server.listen(PORT);
console.log('Server listening on http://localhost:' + PORT);

app.use('/', express.static(__dirname + '/client'));

io.on('connection', function (socket) {
  // emit all logs from history
  simulation.logs().forEach(function(log) {
    socket.emit('log', log);
  });
});

simulation.on('log', function (log) {
  console.log(JSON.stringify(log));

  // emit to all connected clients
  var connections = io.sockets.connected;
  for (var id in connections) {
    if (connections.hasOwnProperty(id)) {
      connections[id].emit('log', log);
    }
  }
});

simulation.start();