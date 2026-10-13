let totalRequests = 0;
let totalResponseTimeMs = 0;
let completedRequests = 0;
const statusCounts = {};

export function trackRequest(req, res, next) {
  totalRequests++;
  const startedAt = process.hrtime.bigint();
  res.once('finish', () => {
    completedRequests++;
    totalResponseTimeMs += Number(process.hrtime.bigint() - startedAt) / 1e6;
    const status = String(res.statusCode);
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  next();
}

export function getTotalRequests() {
  return totalRequests;
}

export function getRequestMetrics() {
  return {
    totalRequests,
    completedRequests,
    averageResponseTimeMs: completedRequests
      ? Number((totalResponseTimeMs / completedRequests).toFixed(2))
      : 0,
    statusCounts: { ...statusCounts },
  };
}

export function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

export default {
  trackRequest,
  getTotalRequests,
  getRequestMetrics,
  formatUptime,
};
