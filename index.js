const express = require("express");
const { doSomeHeavyTask } = require("./util");
const app = express();
const PORT = process.env.PORT || 8000;
const client = require('prom-client');
const responseTime = require('response-time');

// Prometheus metric collection
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki");
const options = {
  transports: [
    new LokiTransport({
      labels: {
        appName: "express",
      },
      host: "http://192.168.0.6:3100",
    }),
  ]
};
const logger = createLogger(options);

const reqResTime = new client.Histogram({
  name: "http_express_req_res_time",
  help: "This tells how much time is taken by req and res",
  labelNames: ["method", "route", "status_code"],
  buckets: [1, 50, 100, 200, 400, 500, 800, 1000, 2000]
});

const totalReqCounter = new client.Counter({
  name: "total_req",
  help: "Tells total req",
});

app.use(
  responseTime((req, res, time) => {
    totalReqCounter.inc();
    reqResTime
      .labels({
        method: req.method,
        route: req.url,
        status_code: res.statusCode,
      })
      .observe(time);
  })
);

app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", client.register.contentType);
  const metrics = await client.register.metrics();
  res.send(metrics);
});

app.get("/", (req, res) => {
  logger.info("Req came on / router");
  return res.json({ message: "Hello from Express Server" });
});

app.get("/slow", async (req, res) => {
  try {
    logger.info("Req came on /slow router");
    const timeTaken = await doSomeHeavyTask();
    return res.json({
      status: "Success",
      message: `Heavy task completed in ${timeTaken}ms`,
    });
  } catch (error) {
    logger.error(error.message);
    return res
      .status(500)
      .json({ status: "Error", error: "Internal Server Error" });
  }
});

app.listen(PORT, () =>
  console.log(`Express Server Started at http://localhost:${PORT}`)
);