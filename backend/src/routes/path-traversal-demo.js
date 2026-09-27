import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = Router();

const ROUTES_DIR = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(ROUTES_DIR, '..', '..'); // backend/
const BASE_DIR = path.join(BACKEND_ROOT, 'archivos-demo'); // carpeta permitida

function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

const relPath = (abs) => path.relative(BACKEND_ROOT, abs).split(path.sep).join('/');

// Sandbox de la demo: nunca sale de backend/ ni toca archivos ocultos
// (.env, .git, ...). Esto no es la defensa de la lección: es el limite
// para que la simulacion no lea archivos reales del proyecto ni del sistema.
function dentroDelSandbox(resolved) {
  if (!isInside(BACKEND_ROOT, resolved)) return false;
  return !relPath(resolved).split('/').some((seg) => seg.startsWith('.'));
}

function entradaInvalida(nombre) {
  return (
    nombre.includes('..') ||
    nombre.includes('/') ||
    nombre.includes('\\') ||
    nombre.includes('\0') ||
    path.isAbsolute(nombre)
  );
}

// GET /api/path-traversal-demo?archivo=NOMBRE&mode=vulnerable|seguro
router.get('/', async (req, res, next) => {
  try {
    const raw = Array.isArray(req.query.archivo) ? req.query.archivo[0] : req.query.archivo;
    const nombre = typeof raw === 'string' ? raw : '';
    // Por defecto, lo seguro (fail-secure). La página siempre envía mode.
    const mode = req.query.mode === 'vulnerable' ? 'vulnerable' : 'seguro';

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        code: 'FALTA_ARCHIVO',
        mode,
        error: 'Falta el parámetro ?archivo=NOMBRE. Ej: ?archivo=reporte.txt',
      });
    }

    let resolved;

    if (mode === 'vulnerable') {
      // ⚠️ VULNERABLE — concatenación directa, sin validar el input.
      // "../secreto-simulado.txt" sube un nivel y sale de archivos-demo/.
      resolved = path.resolve(path.join(BASE_DIR, nombre));

      if (!dentroDelSandbox(resolved)) {
        return res.status(403).json({
          ok: false,
          code: 'DEMO_SANDBOX',
          mode,
          archivo: nombre,
          ruta: relPath(resolved),
          error: 'Esta demo sólo lee archivos dentro de backend/ (y nunca archivos ocultos).',
        });
      }
    } else {
      // ✅ SEGURO — se rechaza cualquier ".." o separador ANTES de tocar el disco.
      if (entradaInvalida(nombre)) {
        return res.status(400).json({
          ok: false,
          code: 'ENTRADA_INVALIDA',
          mode,
          archivo: nombre,
          rutaEvitada: relPath(path.resolve(BASE_DIR, nombre)),
          error: `Entrada inválida: se rechazó "${nombre}". No se permiten ".." ni separadores de ruta.`,
        });
      }

      resolved = path.resolve(BASE_DIR, nombre);

      // Defensa en profundidad: aunque pase el filtro, la ruta resuelta
      // tiene que seguir dentro del directorio permitido.
      if (!isInside(BASE_DIR, resolved)) {
        return res.status(403).json({
          ok: false,
          code: 'FUERA_DE_BASE',
          mode,
          archivo: nombre,
          ruta: relPath(resolved),
          error: 'La ruta resuelta queda fuera del directorio permitido.',
        });
      }
    }

    let contenido;
    try {
      contenido = await fs.readFile(resolved, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({
          ok: false,
          code: 'NO_ENCONTRADO',
          mode,
          archivo: nombre,
          ruta: relPath(resolved),
          error: `No existe el archivo "${nombre}". Probá con reporte.txt, notas.txt o presupuesto.txt.`,
        });
      }
      if (err.code === 'EISDIR') {
        return res.status(400).json({
          ok: false,
          code: 'ES_UN_DIRECTORIO',
          mode,
          archivo: nombre,
          error: `"${nombre}" es un directorio, no un archivo.`,
        });
      }
      throw err;
    }

    return res.json({
      ok: true,
      mode,
      archivo: nombre,
      ruta: relPath(resolved),
      fueraDeBase: !isInside(BASE_DIR, resolved),
      contenido,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
