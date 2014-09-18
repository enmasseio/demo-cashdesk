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
app.use('/node_modules/', express.static(__dirname + '/node_modules'));

io.on('connection', function (socket) {
  // emit all logs from history
  simulation.logs().forEach(function(log) {
    socket.emit('log', log);
  });
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
  console.log('log', JSON.stringify(log));
  broadcast('log', log);
});

simulation.start();
