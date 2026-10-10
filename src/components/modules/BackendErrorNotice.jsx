import React from 'react';
import { getApiBaseUrl } from '../../lib/apiClient.js';

/**
 * Componente React reutilizable para avisos de error de conexión con el backend o servicios externos.
 */
export default function BackendErrorNotice({
  title = 'CONEXIÓN INTERRUMPIDA',
  message = 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.',
  hint = import.meta.env.PROD
    ? 'Publicá el backend por separado y configurá PUBLIC_API_URL en las variables de Vercel para habilitar esta demostración.'
    : 'Asegurate de iniciar el backend con Docker Compose o revisar que el puerto 5000 esté disponible.',
  command = 'cd backend && docker compose up -d',
  showCommand = true,
  onRetry = null,
  onDismiss = null,
  retryLabel = 'Reintentar conexión',
  style = {},
}) {
  const productionApiMissing = import.meta.env.PROD && !import.meta.env.PUBLIC_API_URL;
  const apiLabel = getApiBaseUrl().replace(/^https?:\/\//, '').replace(/\/$/, '') || 'API no configurada';

  return (
    <div style={{ ...styles.banner, ...style }} role="alert">
      <div style={styles.iconCol}>
        <div style={styles.iconGlow}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={styles.svgIcon}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.header}>
          <span style={styles.badge}>{title}</span>
          <span style={styles.port}>{apiLabel}</span>
        </div>
        <p style={styles.message}>{message}</p>
        {hint && <p style={styles.hint}>{hint}</p>}
        {showCommand && command && !productionApiMissing && (
          <div style={styles.commandBox}>
            <span style={styles.commandLabel}>Comando sugerido:</span>
            <code style={styles.commandCode}>{command}</code>
          </div>
        )}
      </div>

      <div style={styles.actions}>
        {onRetry && (
          <button type="button" onClick={onRetry} style={styles.retryBtn}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={styles.retryIcon}
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>{retryLabel}</span>
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            style={styles.dismissBtn}
            title="Cerrar aviso"
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  banner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1.25rem',
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(18, 22, 29, 0.95) 100%)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '16px',
    padding: '1.25rem 1.5rem',
    margin: '1.25rem 0',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), 0 0 20px rgba(239, 68, 68, 0.12)',
    boxSizing: 'border-box',
    width: '100%',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  iconCol: {
    flexShrink: 0,
    paddingTop: '2px',
  },
  iconGlow: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f87171',
  },
  svgIcon: {
    width: '20px',
    height: '20px',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '0.4rem',
    flexWrap: 'wrap',
  },
  badge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#f87171',
    background: 'rgba(239, 68, 68, 0.15)',
    padding: '2px 8px',
    borderRadius: '9999px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  port: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.75rem',
    color: '#64748b',
  },
  message: {
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: 600,
    lineHeight: 1.45,
    margin: '0 0 0.35rem 0',
  },
  hint: {
    color: '#94a3b8',
    fontSize: '0.825rem',
    lineHeight: 1.4,
    margin: '0 0 0.6rem 0',
  },
  commandBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    flexWrap: 'wrap',
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    marginTop: '0.4rem',
    width: 'fit-content',
  },
  commandLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  commandCode: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.8rem',
    color: '#38bdf8',
    background: 'transparent',
    padding: 0,
    border: 'none',
    userSelect: 'all',
  },
  actions: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  retryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    fontSize: '0.825rem',
    fontWeight: 600,
    padding: '0.55rem 0.95rem',
    borderRadius: '9px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  retryIcon: {
    width: '14px',
    height: '14px',
  },
  dismissBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
};
