// ─────────────────────────────────────────────
// SentinelX — Gateway Service
// Day 4: First Express API
// ─────────────────────────────────────────────

const express = require('express');
const db = require('./database');
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

async function initializeDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS metrics (
      id            SERIAL PRIMARY KEY,
      server_id     VARCHAR(50) NOT NULL,
      cpu_usage     NUMERIC(5,2) NOT NULL,
      memory_usage  NUMERIC(5,2) NOT NULL,
      disk_usage    NUMERIC(5,2) DEFAULT 0,
      received_at   TIMESTAMP DEFAULT NOW()
    )
  `;

  try {
    await db.query(createTableQuery);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1); 
  }
}

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


app.post('/metrics', async (req, res) => {
  try{
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
  const result = await db.query(
      `INSERT INTO metrics (server_id, cpu_usage, memory_usage, disk_usage)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [serverId, cpuUsage, memoryUsage, diskUsage || 0]
    );

   const savedMetric = result.rows[0];

  console.log(`Metric received from ${serverId}: CPU ${cpuUsage}%`);

  res.status(201).json({
    message: 'Metric recorded successfully',
    metric : savedMetric
  });
}
catch(error) {
  console.error('Failed to save metric:', error.message);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});


app.get('/metrics', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM metrics
       ORDER BY received_at DESC
       LIMIT 100`
    );

    res.status(200).json({
      count: result.rows.length,
      metrics: result.rows
    });

  } catch (error) {
    console.error('Failed to fetch metrics:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/metrics/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;

    const result = await db.query(
      `SELECT * FROM metrics
       WHERE server_id = $1
       ORDER BY received_at DESC`,
      [serverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: `No metrics found for server: ${serverId}`
      });
    }

    res.status(200).json({
      serverId,
      totalReadings: result.rows.length,
      latest: result.rows[0],
      history: result.rows
    });

  } catch (error) {
    console.error('Failed to fetch server metrics:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/status', async (req, res) => {
  try {

    // This single SQL query does what our JavaScript
    // map/filter logic did before — but in the database
    // which is much faster at scale
    const result = await db.query(`
      SELECT DISTINCT ON (server_id)
        server_id,
        cpu_usage,
        memory_usage,
        disk_usage,
        received_at
      FROM metrics
      ORDER BY server_id, received_at DESC
    `);

    const getStatus = (value) => {
      if (value > 90) return 'critical';
      if (value > 75) return 'warning';
      return 'normal';
    };

    const servers = result.rows.map(row => ({
      serverId: row.server_id,
      cpuStatus: getStatus(row.cpu_usage),
      memoryStatus: getStatus(row.memory_usage),
      diskStatus: getStatus(row.disk_usage),
      lastSeen: row.received_at
    }));

    // Count totals
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM metrics'
    );

    res.status(200).json({
      platform: 'SentinelX',
      totalServersReporting: servers.length,
      totalMetricsStored: parseInt(countResult.rows[0].total),
      servers,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to fetch status:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
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

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log('═══════════════════════════════════════');
    console.log('     SENTINELX — GATEWAY SERVICE       ');
    console.log('═══════════════════════════════════════');
    console.log(`  Status   : Running`);
    console.log(`  Port     : ${PORT}`);
    console.log(`  Database : PostgreSQL`);
    console.log(`  URL      : http://localhost:${PORT}`);
    console.log('═══════════════════════════════════════\n');
  });
});