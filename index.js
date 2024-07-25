const express = require("express");
const responseTime = require("response-time");
const client = require("prom-client");
const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki");
const options = {
  transports: [
    new LokiTransport({
      labels: {
        appName: "express",
      },
      host: "http://127.0.0.1:3100",
    }),
  ],
};

const logger = createLogger(options);
const app = express();
const port = process.env.PORT || 8000;

const collectDefaultMetrics = client.collectDefaultMetrics;
const Registry = client.Registry;
const register = new Registry();
collectDefaultMetrics({ register });

const doSomeHeavyTask = () => {
  return new Promise((resolve, reject) => {
    const startTime = new Date();
    for (let i = 0; i < 1000000000; i++) {
      // Do some heavy task
    }
    const endTime = new Date();
    const timeTaken = endTime - startTime;
    resolve(timeTaken);
  });
};

const reqResTime = new client.Histogram({
  name: "http_express_req_res_time",
  help: "time take by req and res",
  labelNames: ["method", "route", "status_code"],
  buckets: [1, 50, 100, 200, 400, 500, 800, 1000, 2000],
});

const totalReqCounter = new client.Counter({
  name: "http_express_total_req_counter",
  help: "total request counter",
  labelNames: ["method", "route", "status_code"],
});

app.use(
  responseTime((req, res, time) => {
    totalReqCounter.inc();
    reqResTime
      .labels(req.method, req.url, res.statusCode.toString())
      .observe(time / 1000); // Convert milliseconds to seconds
  })
);

app.get("/", (req, res) => {
  logger.info("Hello World");
  return res.json({ message: "Hello World" });
});

app.get("/slow", async (req, res) => {
  try {
    logger.info("Slow request started");
    const timeTaken = await doSomeHeavyTask();
    return res.json({
      status: "Success",
      message: `Task completed in ${timeTaken}ms`,
    });
  } catch (error) {
    logger.error("Internal Server Error");
    return res
      .status(500)
      .json({ status: "Error", message: "Internal Server Error" });
  }
});

app.get("/metrics", async (req, res) => {
  logger.info("Metrics request");
  res.setHeader("Content-Type", client.register.contentType);
  const metrics = await client.register.metrics();
  res.send(metrics);
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

// to run dockerFile
// docker compose up

// for Loki
// docker run -d --name=loki -p 3100:3100 grafana/loki
// localhost: 3100

// for Grafana
// docker run -d -p 3000:3000 --name=grafana grafana/grafana-oss
// localhost: 3000
