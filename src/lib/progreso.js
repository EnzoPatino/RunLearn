/**
 * RunLearn - Gestor de Progreso del Alumno
 * Sincroniza el estado de clases completadas entre Supabase (/api/progreso) y localStorage.
 */
import { fetchWithTimeout, getApiBaseUrl } from './apiClient.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';

const STORAGE_KEY = 'runlearn:progreso';

function readLocalProgreso() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalProgreso(data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

async function getAccessToken() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Obtiene el mapa de progreso { [clase_id]: boolean }.
 */
export async function getProgreso() {
  const local = readLocalProgreso();
  const token = await getAccessToken();
  if (!token) return local;

  const apiBase = getApiBaseUrl();
  if (!apiBase) return local;

  try {
    const res = await fetchWithTimeout(
      `${apiBase}/api/progreso`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
      4000
    );

    if (res.ok) {
      const serverRows = await res.json();
      const merged = { ...local };
      if (Array.isArray(serverRows)) {
        for (const row of serverRows) {
          if (row.clase_id) {
            merged[row.clase_id] = Boolean(row.completado);
          }
        }
      }
      writeLocalProgreso(merged);
      return merged;
    }
  } catch {}

  return local;
}

/**
 * Actualiza el estado de una clase (completada o no).
 * @param {string} claseId
 * @param {boolean} completado
 */
export async function setProgresoClase(claseId, completado) {
  if (!claseId) return;

  const current = readLocalProgreso();
  current[claseId] = Boolean(completado);
  writeLocalProgreso(current);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('runlearn:progreso-updated', {
        detail: { claseId, completado: Boolean(completado), progreso: current },
      })
    );
  }

  const token = await getAccessToken();
  const apiBase = getApiBaseUrl();

  if (token && apiBase) {
    try {
      await fetchWithTimeout(
        `${apiBase}/api/progreso`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ clase_id: claseId, completado: Boolean(completado) }),
        },
        5000
      );
    } catch {}
  }

  return current;
}

/**
 * Alterna el estado de completado de una clase.
 * @param {string} claseId
 */
export async function toggleProgresoClase(claseId) {
  const current = readLocalProgreso();
  const isDone = Boolean(current[claseId]);
  return setProgresoClase(claseId, !isDone);
}
