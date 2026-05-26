// ─────────────────────────────────────────────
// SentinelX — Async Health Check Pipeline
// Day 3: Asynchronous JavaScript
// ─────────────────────────────────────────────

// Simulates fetching one server's current metrics
// In the real platform, this will query PostgreSQL

function fetchMetrics(serverId) {
  return new Promise ((resolve, reject) => {
    const delay = Math.floor(Math.random() * 1000) + 200;
    setTimeout(() => {
      if (serverId ==="srv-005") {
        reject(new Error (`Cannot reach ${serverId}: Connection timeout`));
        return ;
      }

      resolve({
        id: serverId,
        cpuUsage: Math.floor(Math.random() * 100),
        memoryUsage: Math.floor(Math.random() * 100),
        diskUsage: Math.floor(Math.random() * 100),
        responseTime: Math.floor(Math.random() * 500)
      });
    },delay);
  });
}

function buildHealthReport(metrics) {
  const getStatus = (value) => {
    if (value > 90) return "critical";
    if (value > 75) return "warning";
    return "normal";
  };

  const cpuStatus = getStatus(metrics.cpuUsage);
  const memStatus = getStatus(metrics.memoryUsage);
  const diskStatus = getStatus(metrics.diskUsage);

  const isCritical = [cpuStatus, memStatus, diskStatus].includes("critical");
  const isWarning = [cpuStatus, memStatus, diskStatus].includes("warning");

  return {
    serverId: metrics.id,
    cpuStatus,
    memStatus,
    diskStatus,
    overallStatus: isCritical ? "critical" : isWarning ? "warning" : "healthy",
    checkedAt: new Date().toISOString()
  };
}

async function checkServer(serverId) {
  try {
    const metrics = await fetchMetrics(serverId);
    const report = buildHealthReport(metrics);
    return { success: true, report };
  } catch (error) {
    return {
      success: false,
      report: {
        serverId,
        overallStatus: "unreachable",
        error: error.message,
        checkedAt: new Date().toISOString()
      }
    };
  }
}

async function runPlatformHealthCheck(serverIds) {
  console.log(`\nStarting health check for ${serverIds.length} servers...\n`);
  
  const startTime = Date.now();

  const results = await Promise.all(
    serverIds.map(id => checkServer(id))
  );
  const duration = Date.now() - startTime;

  const reports = results.map(r => r.report);
  const critical = reports.filter(r => r.overallStatus === "critical");
  const warning = reports.filter(r => r.overallStatus === "warning");
  const unreachable = reports.filter(r => r.overallStatus === "unreachable");
  const healthy = reports.filter(r => r.overallStatus === "healthy");

  console.log("═══════════════════════════════════════");
  console.log("     SENTINELX — PLATFORM HEALTH       ");
  console.log("═══════════════════════════════════════");
  console.log(`  Checked in     : ${duration}ms`);
  console.log(`  Total Servers  : ${reports.length}`);
  console.log(`  Healthy        : ${healthy.length}`);
  console.log(`  Warning        : ${warning.length}`);
  console.log(`  Critical       : ${critical.length}`);
  console.log(`  Unreachable    : ${unreachable.length}`);
  console.log("═══════════════════════════════════════\n");

  if (critical.length > 0) {
    console.log("🔴 CRITICAL:");
    critical.forEach(r => {
      console.log(`   ${r.serverId} — CPU: ${r.cpuStatus}, Memory: ${r.memStatus}, Disk: ${r.diskStatus}`);
    });
    console.log("");
  }

  if (warning.length > 0) {
    console.log("🟡 WARNING:");
    warning.forEach(r => {
      console.log(`   ${r.serverId} — CPU: ${r.cpuStatus}, Memory: ${r.memStatus}, Disk: ${r.diskStatus}`);
    });
    console.log("");
  }

  if (unreachable.length > 0) {
    console.log("⚫ UNREACHABLE:");
    unreachable.forEach(r => {
      console.log(`   ${r.serverId} — ${r.error}`);
    });
    console.log("");
  }

  console.log("✅ Health check complete.\n");
}

const monitoredServers = ["srv-001", "srv-002", "srv-003", "srv-004", "srv-005"];
runPlatformHealthCheck(monitoredServers);

