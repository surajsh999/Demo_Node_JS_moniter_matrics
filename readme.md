# Server Monitoring with Grafana Prometheus and Loki
## Express Server with Heavy Task Simulation

This is a simple Express server that demonstrates handling a heavy task simulation using Node.js. The server provides two endpoints: one for a basic "Hello" message and another for simulating a heavy task with random completion times and occasional errors.

## Prerequisites

- Node.js (version 20.13.1 or higher)
- npm (version 10.5.2 or higher)

## Installation

1. Clone the repository or download the source code.

2. Open a terminal and navigate to the project directory.

3. Run the following command to install the required dependencies (Express):

```
npm install express
```

4. After the installation is complete, run the following command to start the application:

```
node index.js
```

output
`Express Server Started at http://localhost:8000`

5. Open a web browser or use a tool like cURL to access the following endpoints:

- `http://localhost:8000`: Returns a simple "Hello from Express Server" message.
- `http://localhost:8000/slow`: Simulates a heavy task with random completion times and occasional errors.

6. To stop the server, press `Ctrl + C` in the terminal where the server is running.


------------------------------------------------------------------
## install Prometheus client for node.js
google it prom client (or) copy from below 
```
npm i prom-client
```
```
http://localhost:8000/metrics
```
## install Prometheus server using docker compose

prometheus-config.yml
```
global:
  scrape_interval: 4s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["192.168.0.6:8000"]
```
docker-compose.yml
```
version: "3"

services:
  prom-server:
    image: prom/prometheus
    ports:
      - 9090:9090
    volumes:
      - ./prometheus-config.yml:/etc/prometheus/prometheus.yml
```
```
docker compose up
```
```
`http://localhost:9090/`
`http://localhost:9090/targets`
`http://localhost:9090/graph` process_cpu_seconds_total
```
## Setup Grafana

```
docker run -d -p 3000:3000 --name=grafana grafana/grafana-oss
```

`http://localhost:3000/`

username = admin
Password = admin

click on Home ==> Connections ==> Data sources 
select ==> prometheus ==> Connection ==> http://192.168.0.6:9090
==> Save & test

Then Go back and click on DASHBOARDS

==> DASHBOARDS ==> Add visualization ==> prometheus ==> query ==> metric ==> from drop down select any ==> Run Queries ==> you can see the graph 

-----------------------------------------------------------------------
google it grafana nodejs dashboard (to copy pre designed Import the dashboard template)

==> Go to any site then ==> Copy ID to Clipboard
Home ==> Dashboards ==> New ==> Import ==> 11159 ==> load 
==> select prometheus ==> import

info : prometheus keeps data for 15 days

## Setup Loki Server
```
docker run -d --name=loki -p 3100:3100 grafana/loki
```
winston loki

https://www.npmjs.com/package/winston-loki

==> example ==> copy ==> paste ==> index.js

npm i winston winston-loki


grafana ==> Home ==> Connections ==> Data sources ==> loki 

http://192.168.0.6:3100

Save & test
-----------------------------------------------------------------
## live log display in tabler form
### info log
Home ==> Dashboards ==> NodeJS Application Dashboard
==> add visualization ==> change to table 
==> click on table view
Data source ==> loki ==> change name = error 
Label filters lable = appName ==> value = select express
add new lable click on + lable = level ==> value = error

(or) code =
```
{appName="express", level="error"} |= ``
```
### Error log
==> add visualization ==> change to table 
==> click on table view
Data source ==> loki ==> change name = info
Label filters lable = appName ==> value = select express
add new lable click on + lable = level ==> value = info

(or)

code = 
```
{appName="express", level="info"} |= ``
```
-------------------------------------------------------------------------
## live site health in graph

==> add visualization ==> Data source ==> prometheus ==>Metric ==> http_express_req_res_time_bucket 
==> Label filters (selete) route != /metrics

click on (hint: add histogram_quantile)
==> Sum by ==> (label = le) add lable (lable = route)  

(or)  code ==>
 ```
 histogram_quantile(0.95, sum by(le, route) (rate(http_express_req_res_time_bucket{route!="/metrics"}[$__rate_interval])))
```
-----------------------------------------------------------------------------
Request Count

==> add visualization ==> Data source ==> prometheus ==> graph = stat
==>Metric ==> total_req 

or 

code = total_req

----------------------------------------------------------------------------------
ref . https://gist.github.com/piyushgarg-dev/7c4016b12301552b628bbac21a11e6ab