const fs = require("node:fs");
const path = require("node:path");
const autocannon = require("autocannon");

const targetUrl = process.env.PERF_TARGET_URL || "http://localhost:5000/api/v1/health";
const connections = Number(process.env.PERF_CONNECTIONS || 20);
const duration = Number(process.env.PERF_DURATION_SECONDS || 15);

function interpolateP95(latency) {
  if (typeof latency.p95 === "number") {
    return latency.p95;
  }

  if (typeof latency.p90 === "number" && typeof latency.p97_5 === "number") {
    const ratio = (95 - 90) / (97.5 - 90);
    return Number((latency.p90 + ratio * (latency.p97_5 - latency.p90)).toFixed(2));
  }

  return null;
}

function runAutocannon(options) {
  return new Promise((resolve, reject) => {
    autocannon(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
}

async function run() {
  const result = await runAutocannon({
    url: targetUrl,
    method: "GET",
    connections,
    duration,
    headers: {
      Accept: "application/json",
    },
  });

  const p95 = interpolateP95(result.latency);

  const summary = {
    generatedAt: new Date().toISOString(),
    targetUrl,
    connections,
    durationSeconds: duration,
    latencyMs: {
      average: result.latency.average,
      min: result.latency.min,
      max: result.latency.max,
      p90: result.latency.p90,
      p95,
      p97_5: result.latency.p97_5,
      p99: result.latency.p99,
    },
    throughput: {
      requestsAverage: result.requests.average,
      requestsTotal: result.requests.total,
      bytesAverage: result.throughput.average,
      bytesTotal: result.throughput.total,
    },
    errors: result.errors,
    timeouts: result.timeouts,
    non2xx: result.non2xx,
    successRate:
      result.requests.total > 0
        ? Number((((result.requests.total - result.non2xx) / result.requests.total) * 100).toFixed(2))
        : 0,
  };

  const docsDir = path.resolve(__dirname, "../../docs");
  fs.mkdirSync(docsDir, { recursive: true });

  const jsonPath = path.join(docsDir, "perf-smoke-results.json");
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  const markdownPath = path.join(docsDir, "PERF_P95_REPORT.md");
  const markdown = [
    "# Performance Smoke Report",
    "",
    `Generated: ${summary.generatedAt}`,
    `Target: ${summary.targetUrl}`,
    `Connections: ${summary.connections}`,
    `Duration: ${summary.durationSeconds}s`,
    "",
    "## Latency",
    "",
    `- Average: ${summary.latencyMs.average} ms`,
    `- P90: ${summary.latencyMs.p90} ms`,
    `- P95: ${summary.latencyMs.p95 ?? "n/a"} ms`,
    `- P99: ${summary.latencyMs.p99} ms`,
    `- Min/Max: ${summary.latencyMs.min} ms / ${summary.latencyMs.max} ms`,
    "",
    "## Throughput",
    "",
    `- Requests/sec (avg): ${summary.throughput.requestsAverage}`,
    `- Requests total: ${summary.throughput.requestsTotal}`,
    `- Bytes/sec (avg): ${summary.throughput.bytesAverage}`,
    "",
    "## Error Budget",
    "",
    `- Errors: ${summary.errors}`,
    `- Timeouts: ${summary.timeouts}`,
    `- Non-2xx: ${summary.non2xx}`,
    `- Success rate: ${summary.successRate}%`,
    "",
    ...(summary.non2xx > 0
      ? [
          "WARNING: Non-2xx responses detected. Validate endpoint health and auth assumptions before using this run for SLO decisions.",
          "",
        ]
      : []),
    "This is a lightweight smoke run intended for trend tracking, not a full capacity test.",
  ].join("\n");

  fs.writeFileSync(markdownPath, markdown);

  console.log(`Performance report written to ${markdownPath}`);
  console.log(`Raw results written to ${jsonPath}`);
}

run().catch((error) => {
  console.error("Performance smoke test failed", error);
  process.exit(1);
});
