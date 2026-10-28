import { Router } from 'express';

const router = Router();

// Simulación en memoria de un broker Kafka con 3 topics y 3 particiones cada uno
const TOPICS = {
  'orders': {
    partitions: [[], [], []],
    consumerGroups: {
      'order-processor': [0, 0, 0], // offsets por partición
      'analytics-service': [0, 0, 0],
    },
  },
  'payments': {
    partitions: [[], []],
    consumerGroups: {
      'payment-processor': [0, 0],
    },
  },
  'notifications': {
    partitions: [[], [], [], []],
    consumerGroups: {
      'email-service': [0, 0, 0, 0],
      'push-service': [0, 0, 0, 0],
    },
  },
};

let globalMessageId = 0;

function getPartitionIndex(key, partitionCount) {
  if (!key) return Math.floor(Math.random() * partitionCount);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % partitionCount;
}

/**
 * GET /api/kafka-demo/topics
 * Estado actual de todos los topics con métricas de particiones y consumer groups.
 */
router.get('/topics', (req, res) => {
  const summary = {};
  for (const [topicName, topic] of Object.entries(TOPICS)) {
    summary[topicName] = {
      partitionCount: topic.partitions.length,
      partitions: topic.partitions.map((msgs, idx) => ({
        id: idx,
        messageCount: msgs.length,
        latestOffset: msgs.length,
        latestMessage: msgs[msgs.length - 1] || null,
      })),
      consumerGroups: Object.entries(topic.consumerGroups).map(([group, offsets]) => ({
        name: group,
        offsets,
        lag: offsets.map((off, idx) => topic.partitions[idx].length - off),
        totalLag: offsets.reduce((acc, off, idx) => acc + (topic.partitions[idx].length - off), 0),
      })),
      totalMessages: topic.partitions.reduce((a, p) => a + p.length, 0),
    };
  }
  return res.json({ topics: summary, totalTopics: Object.keys(TOPICS).length });
});

/**
 * POST /api/kafka-demo/produce
 * Produce un mensaje a un topic con particionamiento por key.
 * Body: { topic, key, value, headers }
 */
router.post('/produce', (req, res) => {
  const { topic: topicName, key, value, headers = {} } = req.body || {};

  if (!topicName || !value) {
    return res.status(400).json({ error: 'topic y value son requeridos' });
  }
  const topic = TOPICS[topicName];
  if (!topic) {
    return res.status(404).json({ error: `Topic "${topicName}" no existe. Disponibles: ${Object.keys(TOPICS).join(', ')}` });
  }

  const partitionIndex = getPartitionIndex(key, topic.partitions.length);
  const offset = topic.partitions[partitionIndex].length;

  const message = {
    id: ++globalMessageId,
    topic: topicName,
    partition: partitionIndex,
    offset,
    key: key || null,
    value,
    headers,
    timestamp: new Date().toISOString(),
    size: JSON.stringify({ key, value, headers }).length,
  };

  topic.partitions[partitionIndex].push(message);

  return res.json({
    produced: message,
    partitioning: {
      key: key || '(sin key → random)',
      algorithm: key ? 'murmur2 hash de la key' : 'round-robin',
      selectedPartition: partitionIndex,
      totalPartitions: topic.partitions.length,
      explanation: key
        ? `Hash de "${key}" → partición ${partitionIndex}. Mensajes con la misma key siempre van a la misma partición (orden garantizado).`
        : `Sin key: partición seleccionada aleatoriamente (${partitionIndex}). Sin garantía de orden entre mensajes.`,
    },
  });
});

/**
 * POST /api/kafka-demo/consume
 * Consume mensajes desde un topic como un consumer group.
 * Body: { topic, consumerGroup, maxMessages }
 */
router.post('/consume', (req, res) => {
  const { topic: topicName, consumerGroup, maxMessages = 5 } = req.body || {};

  if (!topicName || !consumerGroup) {
    return res.status(400).json({ error: 'topic y consumerGroup son requeridos' });
  }
  const topic = TOPICS[topicName];
  if (!topic) {
    return res.status(404).json({ error: `Topic "${topicName}" no existe` });
  }
  if (!topic.consumerGroups[consumerGroup]) {
    return res.status(404).json({
      error: `Consumer group "${consumerGroup}" no está registrado en "${topicName}"`,
      availableGroups: Object.keys(topic.consumerGroups),
    });
  }

  const offsets = topic.consumerGroups[consumerGroup];
  const consumed = [];
  const newOffsets = [...offsets];

  for (let p = 0; p < topic.partitions.length; p++) {
    const msgs = topic.partitions[p];
    const from = offsets[p];
    const slice = msgs.slice(from, from + Math.ceil(maxMessages / topic.partitions.length));
    consumed.push(...slice);
    newOffsets[p] = from + slice.length;
  }

  // Actualizar offsets
  topic.consumerGroups[consumerGroup] = newOffsets;

  const lag = newOffsets.map((off, idx) => topic.partitions[idx].length - off);
  const totalLag = lag.reduce((a, b) => a + b, 0);

  return res.json({
    consumed: consumed.slice(0, maxMessages),
    consumerGroup,
    topic: topicName,
    offsetsBefore: offsets,
    offsetsAfter: newOffsets,
    lag,
    totalLag,
    explanation: consumed.length > 0
      ? `Consumer group "${consumerGroup}" leyó ${consumed.length} mensaje(s). Lag restante: ${totalLag}.`
      : `No hay mensajes nuevos para "${consumerGroup}". Lag = 0.`,
  });
});

/**
 * POST /api/kafka-demo/reset
 * Limpia todos los mensajes y resetea los offsets.
 */
router.post('/reset', (req, res) => {
  for (const topic of Object.values(TOPICS)) {
    for (let i = 0; i < topic.partitions.length; i++) {
      topic.partitions[i] = [];
    }
    for (const group of Object.keys(topic.consumerGroups)) {
      topic.consumerGroups[group] = topic.consumerGroups[group].map(() => 0);
    }
  }
  globalMessageId = 0;
  return res.json({ message: 'Broker Kafka reseteado. Todos los topics y offsets limpiados.' });
});

export default router;
