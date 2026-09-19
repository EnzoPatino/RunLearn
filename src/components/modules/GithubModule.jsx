import React, { useState, useEffect } from 'react';

const SUGGESTED_USERS = ['torvalds', 'facebook', 'vercel', 'withastro', 'google'];

export default function GithubModule() {
  const [username, setUsername] = useState('withastro');
  const [inputVal, setInputVal] = useState('withastro');
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusInfo, setStatusInfo] = useState({ status: 200, latency: 0, rateLimit: null });
  const [rawJson, setRawJson] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchRepos = async (userToFetch) => {
    const targetUser = (userToFetch || username).trim();
    if (!targetUser) return;

    setLoading(true);
    setError(null);
    setSelectedRepo(null);
    const start = performance.now();

    try {
      const url = `https://api.github.com/users/${encodeURIComponent(targetUser)}/repos?sort=updated&per_page=12`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const latency = Math.round(performance.now() - start);
      const remaining = res.headers.get('x-ratelimit-remaining');

      setStatusInfo({
        status: res.status,
        latency,
        rateLimit: remaining !== null ? remaining : 'N/A',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setRawJson(errorData);
        if (res.status === 404) {
          throw new Error(`El usuario o repositorio "${targetUser}" no fue encontrado (404).`);
        } else if (res.status === 403) {
          throw new Error('Límite de tasa de la API pública de GitHub alcanzado (Rate limit 403). Probá de nuevo en unos minutos.');
        } else {
          throw new Error(errorData.message || `Error en la petición: HTTP ${res.status}`);
        }
      }

      const data = await res.json();
      setRawJson(data);
      setRepos(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedRepo(data[0]);
      }
    } catch (err) {
      setError(err.message || 'Error al conectar con la API de GitHub');
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos('withastro');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setUsername(inputVal.trim());
      fetchRepos(inputVal.trim());
    }
  };

  const handleSelectSuggested = (user) => {
    setInputVal(user);
    setUsername(user);
    fetchRepos(user);
  };

  const handleCopyJson = () => {
    if (!rawJson) return;
    navigator.clipboard.writeText(JSON.stringify(rawJson, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'Sin fecha';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="gh-module">
      <div className="gh-header">
        <div className="gh-title-group">
          <div className="gh-badge">
            <span className="gh-pulse-dot" />
            GitHub REST API v3
          </div>
          <h2 className="gh-title">Explorador de Repositorios en Vivo</h2>
          <p className="gh-subtitle">
            Consultando directamente <code>https://api.github.com/users/{username}/repos</code>. Cambiá el usuario u organización para inspeccionar el flujo real de respuesta.
          </p>
        </div>

        <div className="gh-meta-badges">
          <div className={`gh-status-badge ${statusInfo.status === 200 ? 'success' : 'warn'}`}>
            HTTP {statusInfo.status}
          </div>
          <div className="gh-latency-badge">
            ⚡ {statusInfo.latency} ms
          </div>
          <div className="gh-rate-badge">
            Límite: {statusInfo.rateLimit} reqs restantes
          </div>
        </div>
      </div>

      {/* Formulario de búsqueda */}
      <form onSubmit={handleSubmit} className="gh-search-form">
        <div className="gh-input-wrapper">
          <svg className="gh-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="gh-input-prefix">https://api.github.com/users/</span>
          <input
            type="text"
            className="gh-input"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="usuario u organización (ej: torvalds, vercel)"
            spellCheck="false"
          />
          <span className="gh-input-suffix">/repos</span>
        </div>
        <button type="submit" className="gh-submit-btn" disabled={loading}>
          {loading ? (
            <span className="gh-btn-loading">
              <span className="gh-spinner" /> Consultando...
            </span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Consultar API
            </>
          )}
        </button>
      </form>

      {/* Sugerencias rápidas */}
      <div className="gh-suggestions">
        <span className="gh-suggestions-label">Usuarios sugeridos:</span>
        <div className="gh-suggestions-list">
          {SUGGESTED_USERS.map((user) => (
            <button
              key={user}
              type="button"
              className={`gh-chip ${username === user ? 'active' : ''}`}
              onClick={() => handleSelectSuggested(user)}
              disabled={loading}
            >
              @{user}
            </button>
          ))}
        </div>
      </div>

      {/* Alerta de error si ocurre */}
      {error && (
        <div className="gh-error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>Error en la petición:</strong> {error}
          </div>
        </div>
      )}

      {/* Contenedor principal: Lista visual + JSON crudo */}
      <div className="gh-grid">
        {/* Panel izquierdo: Lista de repos */}
        <div className="gh-panel">
          <div className="gh-panel-top">
            <div className="gh-panel-heading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Repositorios encontrados ({repos.length})</span>
            </div>
            <span className="gh-panel-sub">Ordenados por último commit / push</span>
          </div>

          <div className="gh-repos-list">
            {loading && repos.length === 0 ? (
              <div className="gh-empty-state">
                <span className="gh-spinner-large" />
                <p>Consultando la API pública de GitHub...</p>
              </div>
            ) : repos.length === 0 && !error ? (
              <div className="gh-empty-state">
                <p>Este usuario no tiene repositorios públicos o no existen datos disponibles.</p>
              </div>
            ) : (
              repos.map((repo) => {
                const isSelected = selectedRepo?.id === repo.id;
                return (
                  <div
                    key={repo.id}
                    className={`gh-repo-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedRepo(repo)}
                  >
                    <div className="gh-repo-main">
                      <div className="gh-repo-title-row">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gh-repo-name"
                          onClick={(e) => e.stopPropagation()}
                          title="Abrir en GitHub"
                        >
                          {repo.name}
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style={{ width: 12, height: 12 }}>
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                        {repo.fork && <span className="gh-fork-tag">fork</span>}
                      </div>

                      {repo.description ? (
                        <p className="gh-repo-desc">{repo.description}</p>
                      ) : (
                        <p className="gh-repo-desc muted">Sin descripción proporcionada.</p>
                      )}
                    </div>

                    <div className="gh-repo-metrics">
                      {/* Estrellas */}
                      <div className="gh-metric-badge stars" title="Cantidad de Stars">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>{repo.stargazers_count.toLocaleString()}</span>
                      </div>

                      {/* Lenguaje principal */}
                      <div className="gh-metric-badge language" title="Lenguaje principal">
                        <span className="gh-lang-dot" />
                        <span>{repo.language || 'Markdown/Varios'}</span>
                      </div>

                      {/* Último commit / push */}
                      <div className="gh-metric-badge commit" title="Fecha del último push o commit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{formatDate(repo.pushed_at || repo.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel derecho: JSON Crudo ("Ver la API por dentro") */}
        <div className="gh-panel gh-json-panel">
          <div className="gh-panel-top">
            <div className="gh-panel-heading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style={{ width: 16, height: 16 }}>
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>Payload JSON en Vivo</span>
            </div>
            <button type="button" className="gh-copy-btn" onClick={handleCopyJson} disabled={!rawJson}>
              {copied ? '¡Copiado!' : 'Copiar JSON'}
            </button>
          </div>

          <div className="gh-json-meta-info">
            <span>
              {selectedRepo ? (
                <>Mostrando objeto puntual: <strong>{selectedRepo.name}</strong> (1 de {repos.length})</>
              ) : (
                <>Array completo devuelto por el endpoint</>
              )}
            </span>
          </div>

          <pre className="gh-json-viewport">
            {rawJson ? (
              JSON.stringify(selectedRepo || rawJson, null, 2)
            ) : (
              'Esperando respuesta de la API...'
            )}
          </pre>
        </div>
      </div>

      <style>{`
        .gh-module {
          margin-top: 2.2rem;
          background: var(--surface-panel, #0d1015);
          border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
          border-radius: var(--radius-lg, 16px);
          padding: 1.8rem;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.35);
        }

        .gh-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-hairline, rgba(255, 255, 255, 0.06));
          padding-bottom: 1.2rem;
        }

        .gh-title-group {
          max-width: 650px;
        }

        .gh-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(226, 232, 240, 0.1);
          color: #f1f5f9;
          font-family: var(--font-mono, monospace);
          font-size: 11.5px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 9999px;
          border: 1px solid rgba(226, 232, 240, 0.2);
          margin-bottom: 8px;
        }

        .gh-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 8px #38bdf8;
        }

        .gh-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .gh-subtitle {
          font-size: 13.5px;
          color: var(--text-secondary, #94a3b8);
          margin: 0;
          line-height: 1.5;
        }

        .gh-subtitle code {
          font-family: var(--font-mono, monospace);
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .gh-meta-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .gh-status-badge, .gh-latency-badge, .gh-rate-badge {
          font-family: var(--font-mono, monospace);
          font-size: 11.5px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .gh-status-badge.success {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .gh-status-badge.warn {
          background: rgba(244, 63, 94, 0.15);
          color: #f43f5e;
          border: 1px solid rgba(244, 63, 94, 0.3);
        }

        .gh-latency-badge {
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.25);
        }

        .gh-rate-badge {
          background: rgba(255, 255, 255, 0.05);
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Buscador */
        .gh-search-form {
          display: flex;
          gap: 10px;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .gh-input-wrapper {
          flex: 1;
          min-width: 280px;
          display: flex;
          align-items: center;
          background: var(--surface-card, #12161d);
          border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
          border-radius: 10px;
          padding: 0 12px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .gh-input-wrapper:focus-within {
          border-color: #e2e8f0;
          box-shadow: 0 0 0 2px rgba(226, 232, 240, 0.15);
        }

        .gh-search-icon {
          width: 16px;
          height: 16px;
          color: #64748b;
          margin-right: 8px;
          flex-shrink: 0;
        }

        .gh-input-prefix, .gh-input-suffix {
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          color: #64748b;
          user-select: none;
        }

        .gh-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-family: var(--font-mono, monospace);
          font-size: 13.5px;
          font-weight: 600;
          padding: 10px 6px;
        }

        .gh-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #e2e8f0;
          color: #07080b;
          border: none;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          padding: 0 20px;
          cursor: pointer;
          transition: transform 0.12s, filter 0.12s;
        }

        .gh-submit-btn:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        .gh-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Sugerencias */
        .gh-suggestions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .gh-suggestions-label {
          font-size: 12px;
          color: #64748b;
        }

        .gh-suggestions-list {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .gh-chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          font-size: 11.5px;
          font-family: var(--font-mono, monospace);
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .gh-chip:hover {
          background: rgba(255, 255, 255, 0.09);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .gh-chip.active {
          background: rgba(226, 232, 240, 0.15);
          color: #ffffff;
          border-color: #e2e8f0;
        }

        /* Error */
        .gh-error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.3);
          color: #fda4af;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 1.5rem;
          font-size: 13.5px;
        }

        .gh-error-banner svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          color: #f43f5e;
        }

        /* Grid */
        .gh-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 1.25rem;
          align-items: start;
        }

        @media (max-width: 900px) {
          .gh-grid {
            grid-template-columns: 1fr;
          }
        }

        .gh-panel {
          background: var(--surface-card, #12161d);
          border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
          border-radius: 12px;
          overflow: hidden;
        }

        .gh-panel-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .gh-panel-heading {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .gh-panel-sub {
          font-size: 11.5px;
          color: #64748b;
        }

        .gh-repos-list {
          max-height: 480px;
          overflow-y: auto;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .gh-repo-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 12px 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .gh-repo-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }

        .gh-repo-card.selected {
          border-color: #38bdf8;
          background: rgba(56, 189, 248, 0.06);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.15);
        }

        .gh-repo-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 5px;
        }

        .gh-repo-name {
          font-size: 14px;
          font-weight: 700;
          color: #38bdf8;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .gh-repo-name:hover {
          text-decoration: underline;
          color: #7dd3fc;
        }

        .gh-fork-tag {
          font-size: 10px;
          font-family: var(--font-mono, monospace);
          background: rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          padding: 1px 5px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .gh-repo-desc {
          font-size: 12.5px;
          line-height: 1.45;
          color: #cbd5e1;
          margin: 0 0 10px 0;
        }

        .gh-repo-desc.muted {
          color: #64748b;
          font-style: italic;
        }

        .gh-repo-metrics {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .gh-metric-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #94a3b8;
        }

        .gh-metric-badge.stars {
          color: #fbbf24;
        }

        .gh-metric-badge.stars svg {
          width: 12px;
          height: 12px;
        }

        .gh-metric-badge.language {
          color: #f1f5f9;
        }

        .gh-lang-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #38bdf8;
        }

        .gh-metric-badge.commit svg {
          width: 11px;
          height: 11px;
          color: #94a3b8;
        }

        /* JSON Panel */
        .gh-json-meta-info {
          padding: 6px 14px;
          background: rgba(0, 0, 0, 0.3);
          font-size: 11.5px;
          color: #94a3b8;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .gh-json-meta-info strong {
          color: #38bdf8;
        }

        .gh-json-viewport {
          margin: 0;
          padding: 14px;
          font-family: var(--font-mono, monospace);
          font-size: 11.5px;
          line-height: 1.55;
          color: #93c5fd;
          background: #090c10;
          max-height: 480px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .gh-copy-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .gh-copy-btn:hover {
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.25);
        }

        .gh-empty-state {
          padding: 3rem 1.5rem;
          text-align: center;
          color: #64748b;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          font-size: 13px;
        }

        .gh-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: gh-spin 0.8s linear infinite;
          display: inline-block;
        }

        .gh-spinner-large {
          width: 24px;
          height: 24px;
          border: 2.5px solid rgba(255, 255, 255, 0.1);
          border-top-color: #38bdf8;
          border-radius: 50%;
          animation: gh-spin 0.8s linear infinite;
        }

        @keyframes gh-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
