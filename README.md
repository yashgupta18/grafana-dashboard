
# Grafana Dashboard for metrics and logs
Basic server to collect metrics and logs from nodejs application and view them on grafana dashboard

## Setup

To run index.js
`node index.js`

Run prometheus
`docker compose up`

To run loki

`docker run -d --name=loki -p 3100:3100 grafana/loki`

To View Grafana dashboard

`docker run -d -p 3000:3000 --name=grafana grafana/grafana-oss`

Grafana username: admin

Grafana password: admin
