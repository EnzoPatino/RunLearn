/**
 * RunLearn - Cliente y utilidades centralizadas de API
 * Manejo consistente de timeouts, detección de caídas de backend y errores de red.
 */

export const DEFAULT_BACKEND_URL = 'http://localhost:5000';
export const DEFAULT_TIMEOUT_MS = 6000;

export const BACKEND_OFFLINE_MESSAGE =
  'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.';

export const BACKEND_TIMEOUT_MESSAGE =
  'Tiempo de espera agotado al conectar con el servidor. Verificá que el backend esté corriendo.';

/**
 * Obtiene la URL base del backend según el entorno.
 * Prioriza RUNLEARN_API_URL en window, luego API_URL, PUBLIC_API_URL y fallback a localhost:5000.
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const win = window;
    if (win.RUNLEARN_API_URL) return win.RUNLEARN_API_URL;
    if (win.API_URL) return win.API_URL;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_API_URL) {
    return import.meta.env.PUBLIC_API_URL;
  }
  return DEFAULT_BACKEND_URL;
}

/**
 * Realiza un fetch con timeout configurable y normalización de errores de red.
 * Si el servidor no responde o la conexión falla, lanza un error tipificado con mensaje claro.
 *
 * @param {string} url - URL a consultar
 * @param {RequestInit} [options={}] - Opciones de fetch estándar
 * @param {number} [timeoutMs=6000] - Tiempo máximo de espera en milisegundos
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  let didTimeout = false;

  const timer = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  // Si el usuario proporcionó su propio signal, encadenamos la cancelación
  let cleanupCallerSignal = null;
  if (options.signal) {
    if (options.signal.aborted) {
      clearTimeout(timer);
      controller.abort();
    } else {
      const onCallerAbort = () => controller.abort();
      options.signal.addEventListener('abort', onCallerAbort);
      cleanupCallerSignal = () => options.signal.removeEventListener('abort', onCallerAbort);
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    const error = new Error();

    if (didTimeout || (err && err.name === 'AbortError' && didTimeout)) {
      error.name = 'TimeoutError';
      error.message = BACKEND_TIMEOUT_MESSAGE;
      error.isTimeout = true;
      error.isBackendError = true;
      error.status = 0;
      error.statusText = 'Timeout';
      error.originalError = err;
      throw error;
    }

    if (err && err.name === 'AbortError' && !didTimeout) {
      // Abort intencional disparado por caller signal
      throw err;
    }

    // Error de red común (TypeError: Failed to fetch, Connection refused, etc.)
    error.name = 'NetworkError';
    error.message = BACKEND_OFFLINE_MESSAGE;
    error.isNetworkError = true;
    error.isBackendError = true;
    error.status = 0;
    error.statusText = 'Network Error';
    error.originalError = err;
    throw error;
  } finally {
    clearTimeout(timer);
    if (cleanupCallerSignal) cleanupCallerSignal();
  }
}

/**
 * Evalúa si un error corresponde a una falla de conexión o timeout del backend.
 *
 * @param {any} err
 * @returns {boolean}
 */
export function isBackendConnectionError(err) {
  if (!err) return false;
  if (err.isBackendError || err.isNetworkError || err.isTimeout) return true;
  if (err.name === 'TimeoutError' || err.name === 'NetworkError') return true;
  if (err instanceof TypeError && typeof err.message === 'string') {
    const msg = err.message.toLowerCase();
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed')) {
      return true;
    }
  }
  return false;
}

/**
 * Retorna un mensaje amigable según el tipo de error capturado.
 *
 * @param {any} err
 * @param {string} [fallback=BACKEND_OFFLINE_MESSAGE]
 * @returns {string}
 */
export function getErrorMessage(err, fallback = BACKEND_OFFLINE_MESSAGE) {
  if (!err) return fallback;
  if (err.isTimeout || err.name === 'TimeoutError') {
    return BACKEND_TIMEOUT_MESSAGE;
  }
  if (isBackendConnectionError(err)) {
    return BACKEND_OFFLINE_MESSAGE;
  }
  return err.message || fallback;
}

/**
 * Muestra el banner de error del backend en el DOM si existe.
 *
 * @param {string} [bannerId='backend-error-banner']
 * @param {string} [customMessage]
 */
export function showBackendErrorBanner(bannerId = 'backend-error-banner', customMessage) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(bannerId);
  if (!el) return;

  if (customMessage) {
    const msgEl = el.querySelector('.beb-message');
    if (msgEl) msgEl.textContent = customMessage;
  }
  el.style.display = 'flex';
}

/**
 * Oculta el banner de error del backend en el DOM.
 *
 * @param {string} [bannerId='backend-error-banner']
 */
export function hideBackendErrorBanner(bannerId = 'backend-error-banner') {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(bannerId);
  if (el) el.style.display = 'none';
}
