demo-cashdesk
=============

The Cash Desk Simulation simulates a series of cash desks in a supermarket. There is a number of cash desks, cashiers, and customers. The customers want to stand in the queue as short as possible, and in order to achieve that:

- The customers smartly try to pick the right time to go shopping, when it is relatively quiet in the supermarket.
- The customers choose the cash desk where they (hopefully) will be helped first. Factors influencing this are the number of people in the queue, the amount of groceries they each have, and how fast the cashier behind the cash desk is.

In order to make the best choice qua shopping time and cash desk, a customer has to predict when it will be quiet in the supermarket, and once there, predict how long it takes to resolve the queue before each of the cash desks. 
The customers start without preknowledge. Over time, they learn to estimate how long checking out takes depending on the amount of groceries and the speed of the individual cashiers and customers, and they learn which moments are most quiet, saving them time too. 

This simulation is a demonstration of [Enmasse](http://enmasse.io), a toolbox to develop large-scale multi-agent systems for both real-time and simulation environments. The following aspects are demonstrated:

- Creating agents
- Communication between agents
- Agents responding to changes (events) in the environment
- Agents learning, modeling, and predicting their environment and acting accordingly
- Running in realtime or in simulated time (hypertime).

Optionally: 
- The demonstration can be scaled to a large amount of actors, and can be distributed over multiple machines. This of course gives an unrealistically sized supermarket, but can be interesting to see the large-scale capabilities of Enmasse.


## Run

To run the simulation, install the project dependencies once:

    npm install
    
And run the simulation:

    node index.js --cashiers 4 --customers 100 --weeks 8
    
Available command line arguments:
 
- `--cashiers` 
- `--customers`
- `--weeks`
- `--strategy`     
  Strategy of customers for selecting a queue: 
  
  - "random" (default) 
  - "queueLength"
  
- `--no-server`  
  A server is started by default, unless this option is specified. In that case the logs are outputted to the terminal.

- `--no-logging` 
  All events are logged by default, unless this option is specified. Not applicable when `--no-server` is specified too.

- `--no-results`  
  Simulation results are saved in a file in folder `./results/`, unless this option is specified.


## Results

View the simulation results in the browser (unless `--no-server` is specified):

    http://localhost:3000

The web page can be used to do some basic querying on the generated logs.

The simulations results are written to a file in the folder `./results/` (unless
`--no-results` is specified).