// ─────────────────────────────────────────────
// SentinelX — Gateway Service
// Day 4: First Express API
// ─────────────────────────────────────────────

const express = require('express');
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const metricsStore = [];

app.post('/metrics', (req, res) => {
  const { serverId, cpuUsage, memoryUsage, diskUsage } = req.body;

  if (!serverId || cpuUsage === undefined || memoryUsage === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: serverId, cpuUsage, memoryUsage'
    });
  }
  if (cpuUsage < 0 || cpuUsage > 100 || memoryUsage < 0 || memoryUsage > 100) {
    return res.status(400).json({
      error: 'cpuUsage and memoryUsage must be between 0 and 100'
    });
  }
  const metric = {
    id: `metric-${Date.now()}`,
    serverId,
    cpuUsage,
    memoryUsage,
    diskUsage: diskUsage || 0,
    receivedAt: new Date().toISOString()
  };

   metricsStore.push(metric);

  console.log(`Metric received from ${serverId}: CPU ${cpuUsage}%`);

  res.status(201).json({
    message: 'Metric recorded successfully',
    metric
  });
});

app.get('/metrics', (req, res) => {
  res.status(200).json({
    count: metricsStore.length,
    metrics: metricsStore
  });
});

app.get('/metrics/:serverId', (req, res) => {

  // req.params contains URL parameters
  const { serverId } = req.params;

  const serverMetrics = metricsStore.filter(
    metric => metric.serverId === serverId
  );

  if (serverMetrics.length === 0) {
    return res.status(404).json({
      error: `No metrics found for server: ${serverId}`
    });
  }

  const latest = serverMetrics[serverMetrics.length - 1];

  res.status(200).json({
    serverId,
    totalReadings: serverMetrics.length,
    latest,
    history: serverMetrics
  });
});

app.get('/status', (req, res) => {
  const serverIds = [...new Set(metricsStore.map(m => m.serverId))];
  const serverSummaries = serverIds.map(id => {
  const serverMetrics = metricsStore.filter(m => m.serverId === id);
  const latest = serverMetrics[serverMetrics.length - 1];
  const getStatus = (value) => {
      if (value > 90) return "critical";
      if (value > 75) return "warning";
      return "normal";
    };
    return {
      serverId: id,
      cpuStatus: getStatus(latest.cpuUsage),
      memoryStatus: getStatus(latest.memoryUsage),
      lastSeen: latest.receivedAt
    };
  });

  res.status(200).json({
    platform: 'SentinelX',
    totalServersReporting: serverIds.length,
    totalMetricsStored: metricsStore.length,
    servers: serverSummaries,
    generatedAt: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.url}`,
    availableRoutes: [
      'GET  /health',
      'GET  /status',
      'POST /metrics',
      'GET  /metrics',
      'GET  /metrics/:serverId'
    ]
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log('     SENTINELX — GATEWAY SERVICE       ');
  console.log('═══════════════════════════════════════');
  console.log(`  Status  : Running`);
  console.log(`  Port    : ${PORT}`);
  console.log(`  URL     : http://localhost:${PORT}`);
  console.log('═══════════════════════════════════════\n');
});