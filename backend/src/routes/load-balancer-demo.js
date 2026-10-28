import { Router } from 'express';

const router = Router();

// Estado en memoria de los 3 servidores simulados
const initialServers = [
  { id: 'server-a', name: 'Server A', activeConnections: 0, totalRequests: 0, region: 'us-east-1', healthy: true },
  { id: 'server-b', name: 'Server B', activeConnections: 0, totalRequests: 0, region: 'eu-west-1', healthy: true },
  { id: 'server-c', name: 'Server C', activeConnections: 0, totalRequests: 0, region: 'ap-southeast-1', healthy: true },
];

let servers = initialServers.map((s) => ({ ...s }));
let roundRobinIndex = 0;
let totalRequestsProcessed = 0;

// Función auxiliar: servidores disponibles (sanos)
function healthyServers() {
  return servers.filter((s) => s.healthy);
}

// Round Robin: rotación cíclica entre servidores sanos
function pickRoundRobin() {
  const healthy = healthyServers();
  if (healthy.length === 0) return null;

  // Avanzar el índice global hasta encontrar uno sano
  let attempts = 0;
  while (attempts < servers.length) {
    const candidate = servers[roundRobinIndex % servers.length];
    roundRobinIndex = (roundRobinIndex + 1) % servers.length;
    attempts++;
    if (candidate.healthy) return candidate;
  }
  return null;
}

// Least Connections: elige el servidor sano con menos conexiones activas
function pickLeastConnections() {
  const healthy = healthyServers();
  if (healthy.length === 0) return null;
  return healthy.reduce((min, s) => (s.activeConnections < min.activeConnections ? s : min));
}

// IP Hash: hash simple de la IP para mapear al mismo servidor de forma consistente
function pickIpHash(clientIp) {
  const healthy = healthyServers();
  if (healthy.length === 0) return null;
  const ip = clientIp || '127.0.0.1';
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash * 31 + ip.charCodeAt(i)) >>> 0;
  }
  return healthy[hash % healthy.length];
}

// Simula que la conexión se mantiene entre 200 y 800 ms, luego se libera
function simulateConnectionDuration(server) {
  const duration = 200 + Math.floor(Math.random() * 600);
  setTimeout(() => {
    server.activeConnections = Math.max(0, server.activeConnections - 1);
  }, duration);
}

// POST /request — selecciona un servidor según el algoritmo solicitado
router.post('/request', (req, res) => {
  const algorithm = String(req.body?.algorithm || 'round-robin').toLowerCase();
  const clientIp = String(req.body?.clientIp || req.ip || '127.0.0.1');

  let selected = null;
  let reasoning = '';

  if (algorithm === 'round-robin') {
    selected = pickRoundRobin();
    reasoning = selected
      ? `Round Robin: siguiente servidor en la rotación cíclica es ${selected.name} (${selected.region}).`
      : 'Round Robin: no hay servidores saludables disponibles.';
  } else if (algorithm === 'least-connections') {
    selected = pickLeastConnections();
    reasoning = selected
      ? `Least Connections: ${selected.name} tiene ${selected.activeConnections} conexiones activas, el mínimo entre los servidores sanos.`
      : 'Least Connections: no hay servidores saludables disponibles.';
  } else if (algorithm === 'ip-hash') {
    selected = pickIpHash(clientIp);
    reasoning = selected
      ? `IP Hash: la IP ${clientIp} se mapea de forma determinista a ${selected.name} (${selected.region}).`
      : 'IP Hash: no hay servidores saludables disponibles.';
  } else {
    return res.status(400).json({ error: `Algoritmo desconocido: "${algorithm}". Usa round-robin, least-connections o ip-hash.` });
  }

  if (!selected) {
    return res.status(503).json({
      error: 'No hay servidores sanos disponibles.',
      allServers: servers,
      totalRequestsProcessed,
    });
  }

  selected.activeConnections += 1;
  selected.totalRequests += 1;
  totalRequestsProcessed += 1;

  simulateConnectionDuration(selected);

  return res.json({
    selectedServer: { ...selected },
    algorithm,
    allServers: servers.map((s) => ({ ...s })),
    totalRequestsProcessed,
    reasoning,
  });
});

// POST /toggle-server — cambia el estado de salud de un servidor
router.post('/toggle-server', (req, res) => {
  const { serverId } = req.body || {};
  const server = servers.find((s) => s.id === serverId);

  if (!server) {
    return res.status(404).json({ error: `Servidor "${serverId}" no encontrado.` });
  }

  server.healthy = !server.healthy;

  return res.json({
    toggled: { ...server },
    allServers: servers.map((s) => ({ ...s })),
  });
});

// GET /status — estado actual de todos los servidores
router.get('/status', (req, res) => {
  return res.json({
    allServers: servers.map((s) => ({ ...s })),
    totalRequestsProcessed,
    healthyCount: healthyServers().length,
  });
});

// POST /reset — restaura el estado inicial de todos los servidores
router.post('/reset', (req, res) => {
  servers = initialServers.map((s) => ({ ...s }));
  roundRobinIndex = 0;
  totalRequestsProcessed = 0;

  return res.json({
    message: 'Estado de los servidores reseteado exitosamente.',
    allServers: servers.map((s) => ({ ...s })),
    totalRequestsProcessed,
  });
});

export default router;
