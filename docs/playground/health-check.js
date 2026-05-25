// ─────────────────────────────────────────────
// SentinelX — Server Health Check Module
// Day 2: First real platform logic
// ─────────────────────────────────────────────

// The servers SentinelX is monitoring
const servers = [
  {id: "srv-001", name: "api-gateway", cpuUsage: 91, memoryUsage: 78, isOnline: true},
  {id: "srv-002", name: "aauth-service", cpuUsage: 34, memoryUsage: 45, isOnline: true},
  {id: "srv-003", name: "metrics-service", cpuUsage: 67, memoryUsage: 82, isOnline: true},
  {id: "srv-004", name: "video-processor", cpuUsage: 98, memoryUsage: 94, isOnline: true},
  {id: "srv-005", name: "notification-service", cpuUsage: 12, memoryUsage: 28, isOnline: true}
];

// Determine status from a usage percentage
function getStatus(usage) {
  if (usage > 90) return "critical"; 
  if (usage > 75) return "warning";
  return "normal";
}

// Analyze a single server and return a health report
function analyzeserver(server) {
  const cpustatus = getStatus(server.cpuUsage);
  const memorystatus = getStatus(server.memoryUsage);

  let overallstatus= "healthy";
  if(!server.isOnline) {
    overallstatus = "offline";
  }
  else if (cpustatus === "critical" || memorystatus === "critical") {
    overallstatus = "critical";
  }
  else if (cpustatus === "warning" || memorystatus === "warning") {
    overallstatus = "warning";
  }

  return {
    id: server.id,
    name: server.name,
    cpustatus,
    memorystatus,
    overallstatus,
    needAttention: overallstatus !== "healthy"
  };
}

const healthReports = servers.map(analyzeserver);

const criticalServers = healthReports.filter(r => r.overallstatus === "critical");
const warningServers = healthReports.filter(r => r.overallstatus === "warning");
const offlineServers = healthReports.filter(r => r.overallstatus === "offline");
const healthyServers = healthReports.filter(r => r.overallstatus === "healthy");

console.log("═══════════════════════════════════════");
console.log("     SENTINELX — PLATFORM HEALTH       ");
console.log("═══════════════════════════════════════");
console.log(`  Total Servers  : ${servers.length}`);
console.log(`  Healthy        : ${healthyServers.length}`);
console.log(`  Warning        : ${warningServers.length}`);
console.log(`  Critical       : ${criticalServers.length}`);
console.log(`  Offline        : ${offlineServers.length}`);
console.log("═══════════════════════════════════════\n");

if(criticalServers.length > 0) {
  console.log("🔴 CRITICAL ALERTS:");
  criticalServers.forEach (server => {
    console.log(`${server.name} - CPU: ${server.cpusatus}, Memory: ${server.memorystatus}`);
  });
  console.log("");
}

if(warningServers.length > 0) {
  console.log("🟡 WARNING ALERTS:");
  warningServers.forEach (server => {
    console.log(`${server.name} - CPU: ${server.cpusatus}, Memory: ${server.memorystatus}`);
  });
  console.log("");
}

if(offlineServers.length > 0) {
  console.log("⚫ OFFLINE ALERTS:");
  offlineServers.forEach (server => {
    console.log(`${server.name} - CPU: ${server.cpusatus}, Memory: ${server.memorystatus}`);
  });
  console.log("");
}

console.log("✅ Health check complete.\n");