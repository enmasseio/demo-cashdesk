demo-cashdesk
=============

Simulation of a cash desk queue using Enmasse.


## Run

To run the simulation, install the project dependencies once:

    npm install
    
And run the simulation:

    node index.js --cashiers 4 --customers 100 --weeks 8
    
Available command line arguments:
 
- `--cashiers` 
- `--customers`
- `--weeks`
- `--no-server`  (a server is started by default)
- `--no-logging` (all events are logged by default)


View the simulation results in the browser:

    http://localhost:3000
