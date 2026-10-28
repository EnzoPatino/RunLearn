import { Router } from 'express';

const router = Router();

// POST /explain - Simula y compara Sequential Scan vs B-Tree Index Scan con métricas reales de páginas de disco (8KB)
router.post('/explain', (req, res) => {
  const { targetId = 7842, useIndex = true, totalRows = 50000 } = req.body || {};
  const clampedRows = Math.min(1000000, Math.max(1000, Number(totalRows) || 50000));
  const clampedTarget = Math.min(clampedRows, Math.max(1, Number(targetId) || 7842));

  // En PostgreSQL, cada bloque/página de disco mide 8 KB y almacena aprox 100-200 tuplas
  const ROWS_PER_PAGE = 120;
  const totalHeapPages = Math.ceil(clampedRows / ROWS_PER_PAGE);
  const targetHeapPage = Math.ceil(clampedTarget / ROWS_PER_PAGE);

  if (useIndex) {
    // B-Tree Index Scan:
    // Profundidad típica de un B-Tree en PG: 3 a 4 niveles (Root -> Internal -> Leaf)
    const treeDepth = clampedRows > 200000 ? 4 : 3;
    const indexPagesRead = treeDepth; // 1 Root + 1-2 Internal + 1 Leaf
    const heapPagesRead = 1; // 1 lectura directa de la página de datos vía puntero TID (Block, Offset)
    const totalBuffers = indexPagesRead + heapPagesRead;
    const executionTimeMs = +(Math.random() * 0.4 + 0.3).toFixed(2); // ~0.3 - 0.7 ms

    const plan = [
      `Index Scan using users_pkey on users  (cost=0.41..8.43 rows=1 width=84) (actual time=${executionTimeMs}..${executionTimeMs} rows=1 loops=1)`,
      `  Index Cond: (id = ${clampedTarget})`,
      `  Buffers: shared hit=${totalBuffers}`,
      `Planning Time: 0.082 ms`,
      `Execution Time: ${executionTimeMs} ms`,
    ];

    return res.json({
      method: 'Index Scan (B-Tree)',
      complexity: 'O(log N)',
      targetId: clampedTarget,
      totalRows: clampedRows,
      heapPagesRead,
      indexPagesRead,
      totalBuffers,
      rowsExamined: 1,
      executionTimeMs,
      treePath: [
        { level: 'Root Node', page: 1, range: `1 - ${clampedRows}` },
        { level: 'Internal Node', page: 24, range: `${Math.floor(clampedTarget * 0.8)} - ${Math.ceil(clampedTarget * 1.2)}` },
        { level: 'Leaf Node', page: 412, key: clampedTarget, tid: `(${targetHeapPage}, ${clampedTarget % ROWS_PER_PAGE})` },
      ],
      explainOutput: plan.join('\n'),
    });
  }

  // Sequential Scan (Sin índice):
  // Recorre secuencialmente todas las páginas del Heap hasta encontrar el registro
  const heapPagesRead = targetHeapPage;
  const rowsExamined = clampedTarget;
  const totalBuffers = heapPagesRead;
  const executionTimeMs = +((clampedTarget / 1500) + Math.random() * 2).toFixed(1); // 10ms - 80ms

  const plan = [
    `Seq Scan on users  (cost=0.00..${(totalHeapPages * 1.5).toFixed(2)} rows=1 width=84) (actual time=${executionTimeMs}..${executionTimeMs} rows=1 loops=1)`,
    `  Filter: (id = ${clampedTarget})`,
    `  Rows Removed by Filter: ${clampedTarget - 1}`,
    `  Buffers: shared read=${totalBuffers}`,
    `Planning Time: 0.045 ms`,
    `Execution Time: ${executionTimeMs} ms`,
  ];

  return res.json({
    method: 'Seq Scan (Full Table Scan)',
    complexity: 'O(N)',
    targetId: clampedTarget,
    totalRows: clampedRows,
    heapPagesRead,
    indexPagesRead: 0,
    totalBuffers,
    rowsExamined,
    executionTimeMs,
    explainOutput: plan.join('\n'),
  });
});

export default router;
