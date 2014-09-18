/** @jsx React.DOM */

var socket = io.connect(location.href);
var logs = [];

var LogTable = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  render: function() {
    var FIELDS = ['seq', 'timestamp', 'simTime', 'prototype', 'id', 'event'];

    var search = this.refs.query && this.refs.query.getDOMNode().value.trim() || '';
    var query = this.state.query;

    var filteredData = this.state.data;
    var queryStyle = {};
    try {
      if (query) {
        query = $objeq(search);
        filteredData = query(this.state.data);
      }
    }
    catch (err) {
      queryStyle = {
        color: 'red'
      };
    }

    function details (log) {
      var extra = {};
      for (var prop in log) {
        if (log.hasOwnProperty(prop)) {
          if (FIELDS.indexOf(prop) === -1) {
            extra[prop] = log[prop];
          }
        }
      }
      return Object.keys(extra).length > 0 ? JSON.stringify(extra) : '';
    }

    var rows = filteredData.map(function (log) {
      return (
          <tr>
            <td>{log.seq}</td>
            <td>{log.timestamp}</td>
            <td>{log.simTime}</td>
            <td>{log.prototype}</td>
            <td>{log.id}</td>
            <td>{log.event}</td>
            <td>{details(log)}</td>
          </tr>
          );
    });

    return (
        <div>
        <p>
        Query: <input ref="query" onChange={this.onSearch} className="query" style={queryStyle} />
        </p>
        <p>
            Example queries (see <a href="https://github.com/agilosoftware/objeq/blob/master/doc/Language-Reference.md" target="_blanc">here</a> for a full reference):
            <pre><code>
              '^T' =~ id<br/>
              timestamp >= '2014-09-18T09:27:25.927Z'<br/>
              event == 'create'<br/>
              order by timestamp desc<br/>
            </code></pre>
        </p>
        <table className="logs">
          <tr>
            <th>seq</th>
            <th>timestamp</th>
            <th>simTime</th>
            <th>prototype</th>
            <th>id</th>
            <th>event</th>
            <th>details</th>
          </tr>
          {rows}
        </table>
        </div>
        );
  },
  onSearch: function () {
    var query = this.refs.query && this.refs.query.getDOMNode().value.trim() || '';
    this.setState({query: query});
  }
});

var table = React.renderComponent(
    <LogTable data={logs} />,
    document.getElementById('content')
);

// listen for log events
socket.on('log', function (log) {
  console.log(log);

  // clear logs on simulation start
  if (log && log.event === 'start') {
    logs = [];
  }

  logs.push(log);
  table.setState({data: logs});
});
