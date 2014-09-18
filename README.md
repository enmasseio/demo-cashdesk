demo-cashdesk
=============

Simulation of a cash desk queue using Enmasse.


## Run

To run the simulation, install the project dependencies once:

    npm install
    
And run the simulation:

    node index.js --cashiers 4 --customers 100
    
Available command line arguments:
 
- `--cashiers` 
- `--customers`
- `--no-server` True by default.


View the simulation results in the browser:

    http://localhost:3000
