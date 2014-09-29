/** @jsx React.DOM */

var socket = io.connect(location.href);
var logs = [];

var MAX_ROW_COUNT = 1000;
var COLUMNS = ['seq', 'timestamp', 'simTime', 'prototype', 'id', 'event'];

var LogTable = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  render: function() {
    var query = this.state.query;

    var filteredData = this.state.data;
    var queryStyle = {};
    try {
      if (query) {
        var q = $objeq(query);
        filteredData = q(this.state.data);
      }
    }
    catch (err) {
      queryStyle = {
        color: 'red'
      };
    }

    function formatDuration(duration) {
      if (duration < 1000) return duration + 'ms';
      if (duration < 60 * 1000) return Math.round(duration / 1000) + 's';
      if (duration < 60 * 60 * 1000) return Math.round(duration / 60 / 1000) + 'm';
      if (duration < 24 * 60 * 60 * 1000) return Math.round(duration / 60 / 60 / 1000) + 'h';
      return Math.round(duration / 24 / 60 / 60 / 1000) + 'd';
    }

    function durationsToSeconds(durations) {
      var formatted = {};
      for (var d in durations) {
        if (durations.hasOwnProperty(d)) {
          formatted[d] = formatDuration(durations[d]);
        }
      }
      return formatted;
    }

    function details (log) {
      var extra = {};
      for (var prop in log) {
        if (log.hasOwnProperty(prop)) {
          if (COLUMNS.indexOf(prop) === -1) {
            extra[prop] = log[prop];
            if (prop == 'durations') {
             extra[prop] = durationsToSeconds(extra[prop]);
            }
          }
        }
      }
      return Object.keys(extra).length > 0 ? JSON.stringify(extra, null, ' ') : '';
    }

    var count = filteredData.length;
    if (count > MAX_ROW_COUNT) {
      filteredData = filteredData.slice(0, MAX_ROW_COUNT)
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

    var summary = (count != filteredData.length) ?
        ('Displaying ' + filteredData.length + ' out of ' + count + ' logs.') :
        ('Displaying ' + filteredData.length + ' logs.');

    return (
        <div>
        <p>
        Query: <input ref="query" onChange={this.search} className="query" style={queryStyle} value={query}/>
            <input type="button" value="clear" onClick={this.clearSearch} />
        </p>
        <p>
            Example queries (see <a href="https://github.com/agilosoftware/objeq/blob/master/doc/Language-Reference.md" target="_blanc">here</a> for a full reference):
            <pre><code>
              'shop' =~ event<br/>
              timestamp >= '2014-09-18T09:27:25.927Z'<br/>
              event == 'create'<br/>
              order by timestamp desc<br/>
            </code></pre>
            {summary}&nbsp;
            Ctrl+Click in the table to filter on the clicked field.
        </p>
        <table className="logs" onClick={this.select}>
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
  search: function () {
    var query = this.refs.query && this.refs.query.getDOMNode().value || '';
    this.setState({query: query});
  },
  clearSearch: function () {
    this.setState({query: ''});
  },
  select: function (event) {
    if (event.nativeEvent.ctrlKey) {
      var target = event.nativeEvent.target;
      var index = [].indexOf.call(target.parentNode.children, target);
      var field = COLUMNS[index];
      var value = target.innerHTML;
      var query = field + ' == ' + '"' + value + '"';

      if (field) {
        this.setState({query: query});
      }
    }
  }
});

var table = React.renderComponent(
    <LogTable data={logs} />,
    document.getElementById('content')
);

function addLog(log) {
  // clear logs on simulation start
  if (log && log.event === 'start') {
    logs = [];
  }
  logs.push(log);
}

// listen for log events
socket.on('log', function (log) {
  addLog(log);
  table.setState({data: logs});
});

// listen for log events
socket.on('logs', function (logs) {
  logs.forEach(addLog);
  table.setState({data: logs});
});
