import React, { useState, useEffect, useMemo } from 'react';

const DEFAULT_API_BASE = 'http://localhost:5000';

const OPERATIONS = [
  {
    id: 'LIST',
    method: 'GET',
    endpoint: '/api/people',
    title: 'Listar Todo',
    desc: 'Obtiene todas las personas registradas en la base de datos PostgreSQL.',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  {
    id: 'GET_ONE',
    method: 'GET',
    endpoint: '/api/people/:id',
    title: 'Obtener por ID',
    desc: 'Busca una persona puntual por su ID en la tabla people.',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  {
    id: 'CREATE',
    method: 'POST',
    endpoint: '/api/people',
    title: 'Crear Persona',
    desc: 'Inserta un nuevo registro con nombre, email y rol.',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  {
    id: 'UPDATE',
    method: 'PUT',
    endpoint: '/api/people/:id',
    title: 'Actualizar',
    desc: 'Actualiza los campos de una persona existente en Postgres.',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  {
    id: 'DELETE',
    method: 'DELETE',
    endpoint: '/api/people/:id',
    title: 'Eliminar',
    desc: 'Borra físicamente el registro de la tabla people por su ID.',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
];

export default function PeopleApiModule() {
  const [activeOp, setActiveOp] = useState('LIST');
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState(null);

  // Form fields
  const [paramId, setParamId] = useState('1');
  const [nombre, setNombre] = useState('Ada Lovelace');
  const [email, setEmail] = useState('ada@runlearn.dev');
  const [rol, setRol] = useState('desarrolladora');

  // Request / Response execution state
  const [loading, setLoading] = useState(false);
  const [sentRequest, setSentRequest] = useState(null);
  const [receivedResponse, setReceivedResponse] = useState(null);
  const [authNotice, setAuthNotice] = useState('');

  // Initial load: get token from localStorage if exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('token');
      if (stored) {
        setToken(stored);
      }
      const customApi = (window.RUNLEARN_API_URL || window.API_URL);
      if (customApi) {
        setApiBase(customApi);
      }
    }
  }, []);

  // Check health on mount
  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await fetch(`${apiBase}/api/health`, { method: 'GET' });
        if (isMounted) {
          setIsBackendHealthy(res.ok);
        }
      } catch {
        if (isMounted) {
          setIsBackendHealthy(false);
        }
      }
    }
    checkHealth();
    return () => { isMounted = false; };
  }, [apiBase]);

  // Quick demo login / token generator
  const handleQuickLogin = async () => {
    setLoading(true);
    setAuthNotice('');
    try {
      // Intentar login con usuario de prueba o registrar si no existe
      const testEmail = `demo_${Date.now().toString().slice(-4)}@runlearn.dev`;
      const testPass = 'devpassword123';

      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPass }),
      });

      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token);
        }
        setAuthNotice(`Token generado exitosamente para ${testEmail}`);
      } else {
        setAuthNotice(data.error || 'No se pudo obtener el token');
      }
    } catch (err) {
      setAuthNotice(`Error de conexión con el backend: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearToken = () => {
    setToken('');
    setAuthNotice('Token removido. Las peticiones enviadas ahora demostrarán la protección 401 de requireAuth.');
  };

  const currentOp = useMemo(() => {
    return OPERATIONS.find((op) => op.id === activeOp) || OPERATIONS[0];
  }, [activeOp]);

  // Compute live URL and preview body
  const currentUrl = useMemo(() => {
    if (currentOp.id === 'GET_ONE' || currentOp.id === 'UPDATE' || currentOp.id === 'DELETE') {
      return `${apiBase}/api/people/${encodeURIComponent(paramId || ':id')}`;
    }
    return `${apiBase}/api/people`;
  }, [apiBase, currentOp, paramId]);

  const liveBodyPayload = useMemo(() => {
    if (currentOp.id === 'CREATE') {
      return { nombre, email, rol };
    }
    if (currentOp.id === 'UPDATE') {
      const payload = {};
      if (nombre) payload.nombre = nombre;
      if (email) payload.email = email;
      if (rol) payload.rol = rol;
      return payload;
    }
    return null;
  }, [currentOp, nombre, email, rol]);

  // Execute the CRUD operation
  const handleExecute = async () => {
    setLoading(true);
    setReceivedResponse(null);

    const startTime = performance.now();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (liveBodyPayload) {
      headers['Content-Type'] = 'application/json';
    }

    const requestSnapshot = {
      method: currentOp.method,
      url: currentUrl,
      headers: { ...headers },
      body: liveBodyPayload ? JSON.stringify(liveBodyPayload, null, 2) : null,
      timestamp: new Date().toLocaleTimeString(),
    };
    setSentRequest(requestSnapshot);

    try {
      const fetchOptions = {
        method: currentOp.method,
        headers,
      };
      if (liveBodyPayload) {
        fetchOptions.body = JSON.stringify(liveBodyPayload);
      }

      const res = await fetch(currentUrl, fetchOptions);
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      let responseBody = null;
      const text = await res.text();
      try {
        responseBody = JSON.parse(text);
      } catch {
        responseBody = text;
      }

      setReceivedResponse({
        status: res.status,
        statusText: res.statusText || (res.status === 200 ? 'OK' : res.status === 201 ? 'Created' : res.status === 401 ? 'Unauthorized' : res.status === 404 ? 'Not Found' : ''),
        ok: res.ok,
        latencyMs,
        headers: Object.fromEntries(res.headers.entries()),
        body: responseBody,
        rawText: typeof responseBody === 'object' ? JSON.stringify(responseBody, null, 2) : String(responseBody),
      });
    } catch (err) {
      const endTime = performance.now();
      setReceivedResponse({
        status: 0,
        statusText: 'Network / Connection Error',
        ok: false,
        latencyMs: Math.round(endTime - startTime),
        headers: {},
        body: { error: err.message, hint: 'Asegurate de que el backend en http://localhost:5000 esté corriendo.' },
        rawText: JSON.stringify({ error: err.message, hint: 'Verifica la conexión con el servidor backend' }, null, 2),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header bar */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.titleRow}>
            <span style={styles.badgeResource}>RECURSO</span>
            <h2 style={styles.title}>People API Explorer</h2>
            <span style={styles.endpointPill}>/api/people</span>
          </div>
          <p style={styles.subtitle}>
            Ejecutá peticiones CRUD reales contra PostgreSQL y observá el paquete HTTP (request y response) en JSON crudo.
          </p>
        </div>

        {/* Backend health status */}
        <div style={styles.headerRight}>
          <div style={styles.healthStatus}>
            <span
              style={{
                ...styles.healthDot,
                backgroundColor: isBackendHealthy === true ? '#10b981' : isBackendHealthy === false ? '#ef4444' : '#f59e0b',
                boxShadow: isBackendHealthy === true ? '0 0 10px #10b981' : 'none',
              }}
            />
            <span style={styles.healthText}>
              {isBackendHealthy === true ? 'Backend Conectado (5000)' : isBackendHealthy === false ? 'Backend Desconectado' : 'Verificando...'}
            </span>
          </div>
        </div>
      </div>

      {/* Auth toolbar */}
      <div style={styles.authBar}>
        <div style={styles.authInfo}>
          <span style={styles.authLabel}>🔐 requireAuth:</span>
          {token ? (
            <span style={styles.authActive}>Token JWT activo ({token.slice(0, 14)}...)</span>
          ) : (
            <span style={styles.authInactive}>Sin token (Peticiones fallarán con 401)</span>
          )}
        </div>

        <div style={styles.authActions}>
          {!token ? (
            <button
              onClick={handleQuickLogin}
              disabled={loading}
              style={styles.btnQuickAuth}
              title="Crea una sesión de prueba rápida en el backend y asigna el Bearer Token"
            >
              🔑 Obtener Token Demo
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowToken(!showToken)}
                style={styles.btnGhostSmall}
              >
                {showToken ? 'Ocultar Token' : 'Ver Token'}
              </button>
              <button
                onClick={handleClearToken}
                style={styles.btnDangerSmall}
                title="Quita el token para probar qué responde el servidor cuando la ruta está protegida"
              >
                Simular sin Token (Test 401)
              </button>
            </>
          )}
        </div>
      </div>

      {showToken && token && (
        <div style={styles.tokenBox}>
          <span style={styles.tokenBoxLabel}>Bearer Token actual:</span>
          <code style={styles.tokenCode}>{token}</code>
        </div>
      )}

      {authNotice && (
        <div style={styles.noticeBox}>
          <span>ℹ️ {authNotice}</span>
          <button onClick={() => setAuthNotice('')} style={styles.noticeClose}>×</button>
        </div>
      )}

      {/* Operations Selector Tabs */}
      <div style={styles.tabsContainer}>
        {OPERATIONS.map((op) => {
          const isActive = op.id === activeOp;
          return (
            <button
              key={op.id}
              onClick={() => setActiveOp(op.id)}
              style={{
                ...styles.tabButton,
                borderColor: isActive ? op.color : 'rgba(255, 255, 255, 0.08)',
                backgroundColor: isActive ? op.bgColor : 'rgba(18, 22, 29, 0.6)',
                color: isActive ? '#ffffff' : '#94a3b8',
              }}
            >
              <span
                style={{
                  ...styles.methodBadge,
                  backgroundColor: op.bgColor,
                  color: op.color,
                  borderColor: op.borderColor,
                }}
              >
                {op.method}
              </span>
              <span style={styles.tabTitle}>{op.title}</span>
            </button>
          );
        })}
      </div>

      {/* Operation Configuration & Input Section */}
      <div style={styles.configCard}>
        <div style={styles.configHeader}>
          <div style={styles.configDescCol}>
            <span style={{ ...styles.activeMethodBadge, color: currentOp.color, borderColor: currentOp.borderColor, backgroundColor: currentOp.bgColor }}>
              {currentOp.method}
            </span>
            <code style={styles.activeUrl}>{currentUrl}</code>
          </div>
          <span style={styles.opDescription}>{currentOp.desc}</span>
        </div>

        {/* Dynamic Inputs depending on operation */}
        <div style={styles.formGrid}>
          {(currentOp.id === 'GET_ONE' || currentOp.id === 'UPDATE' || currentOp.id === 'DELETE') && (
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>Parámetro :id (ID en Postgres)</label>
              <input
                type="number"
                value={paramId}
                onChange={(e) => setParamId(e.target.value)}
                placeholder="1"
                style={styles.inputField}
              />
            </div>
          )}

          {(currentOp.id === 'CREATE' || currentOp.id === 'UPDATE') && (
            <>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Lucía Morales"
                  style={styles.inputField}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="lucia@runlearn.dev"
                  style={styles.inputField}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Rol</label>
                <input
                  type="text"
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  placeholder="estudiante / developer / profesor"
                  style={styles.inputField}
                />
              </div>
            </>
          )}

          <div style={styles.actionCol}>
            <button
              onClick={handleExecute}
              disabled={loading}
              style={{
                ...styles.btnExecute,
                backgroundColor: currentOp.color,
                boxShadow: `0 4px 18px ${currentOp.borderColor}`,
              }}
            >
              {loading ? (
                <span>Ejecutando petición...</span>
              ) : (
                <span>🚀 Enviar {currentOp.method} Request</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Request & Response Dual Viewer */}
      <div style={styles.splitViewer}>
        {/* Left: Request Inspector */}
        <div style={styles.inspectorCard}>
          <div style={styles.inspectorHeader}>
            <div style={styles.inspectorTitleGroup}>
              <span style={styles.inspectorDotRequest}></span>
              <span style={styles.inspectorTitle}>REQUEST ENVIADO</span>
              <span style={styles.inspectorTag}>HTTP Request</span>
            </div>
            {sentRequest && (
              <span style={styles.timestampBadge}>{sentRequest.timestamp}</span>
            )}
          </div>

          <div style={styles.codeBlockContainer}>
            <pre style={styles.codePre}>
              {sentRequest ? (
                <>
                  <div style={styles.rawHttpLine}>
                    <span style={{ color: currentOp.color, fontWeight: 700 }}>{sentRequest.method}</span>{' '}
                    <span style={{ color: '#e2e8f0' }}>{sentRequest.url.replace(apiBase, '')}</span>{' '}
                    <span style={{ color: '#64748b' }}>HTTP/1.1</span>
                  </div>
                  <div style={styles.headerComment}>Host: {apiBase.replace(/^https?:\/\//, '')}</div>
                  {Object.entries(sentRequest.headers).map(([k, v]) => (
                    <div key={k} style={styles.headerLine}>
                      <span style={{ color: '#93c5fd' }}>{k}</span>: <span style={{ color: '#f8fafc' }}>{v}</span>
                    </div>
                  ))}
                  {!sentRequest.headers['Authorization'] && (
                    <div style={styles.headerMissingLine}>
                      # ⚠️ Cabecera Authorization ausente (Se provocará 401)
                    </div>
                  )}

                  {sentRequest.body ? (
                    <>
                      <div style={styles.bodyDivider}># Request Body (JSON crudo):</div>
                      <div style={styles.jsonBodyText}>{sentRequest.body}</div>
                    </>
                  ) : (
                    <div style={styles.emptyBodyNotice}>
                      # Sin cuerpo (Payload vacío para {sentRequest.method})
                    </div>
                  )}
                </>
              ) : (
                <div style={styles.placeholderState}>
                  Presioná <strong>Enviar Request</strong> para inspeccionar los encabezados y payload HTTP que viajan al servidor.
                </div>
              )}
            </pre>
          </div>
        </div>

        {/* Right: Response Inspector */}
        <div style={styles.inspectorCard}>
          <div style={styles.inspectorHeader}>
            <div style={styles.inspectorTitleGroup}>
              <span
                style={{
                  ...styles.inspectorDotResponse,
                  backgroundColor: receivedResponse
                    ? receivedResponse.ok
                      ? '#10b981'
                      : '#ef4444'
                    : '#64748b',
                }}
              ></span>
              <span style={styles.inspectorTitle}>RESPONSE RECIBIDO</span>
              <span style={styles.inspectorTag}>PostgreSQL & Express</span>
            </div>

            {receivedResponse && (
              <div style={styles.responseMetaGroup}>
                <span
                  style={{
                    ...styles.statusPill,
                    backgroundColor: receivedResponse.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: receivedResponse.ok ? '#34d399' : '#f87171',
                    borderColor: receivedResponse.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {receivedResponse.status} {receivedResponse.statusText}
                </span>
                <span style={styles.latencyPill}>⚡ {receivedResponse.latencyMs} ms</span>
              </div>
            )}
          </div>

          <div style={styles.codeBlockContainer}>
            <pre style={styles.codePre}>
              {receivedResponse ? (
                <>
                  <div style={styles.jsonResponseText}>
                    {receivedResponse.rawText}
                  </div>
                </>
              ) : (
                <div style={styles.placeholderState}>
                  Esperando respuesta del servidor. Al ejecutar una acción, acá se mostrará el JSON crudo retornado por Express y PostgreSQL.
                </div>
              )}
            </pre>
          </div>

          {/* Quick-select helper if response is a list of people */}
          {receivedResponse && Array.isArray(receivedResponse.body) && receivedResponse.body.length > 0 && (
            <div style={styles.quickSelectBar}>
              <span style={styles.quickSelectLabel}>Seleccionar ID rápido:</span>
              <div style={styles.chipsContainer}>
                {receivedResponse.body.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setParamId(String(item.id));
                      if (item.nombre) setNombre(item.nombre);
                      if (item.email) setEmail(item.email);
                      if (item.rol) setRol(item.rol);
                    }}
                    style={styles.chipButton}
                    title={`Cargar datos de ${item.nombre} en el formulario`}
                  >
                    #{item.id} {item.nombre} ({item.rol})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    margin: '2rem 0',
    backgroundColor: '#0d1015',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1.75rem',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    color: '#f1f5f9',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.25rem',
    paddingBottom: '1.25rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    maxWidth: '720px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '6px',
  },
  badgeResource: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '4px',
    padding: '2px 7px',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  endpointPill: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '3px 8px',
  },
  subtitle: {
    fontSize: '13.5px',
    color: '#94a3b8',
    lineHeight: 1.5,
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  healthStatus: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: 'rgba(18, 22, 29, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '9999px',
  },
  healthDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  healthText: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  authBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: 'rgba(18, 22, 29, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    marginBottom: '1.25rem',
  },
  authInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12.5px',
  },
  authLabel: {
    fontWeight: 600,
    color: '#cbd5e1',
  },
  authActive: {
    color: '#34d399',
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
  },
  authInactive: {
    color: '#f87171',
    fontWeight: 500,
  },
  authActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  btnQuickAuth: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  btnGhostSmall: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11.5px',
    cursor: 'pointer',
  },
  btnDangerSmall: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11.5px',
    cursor: 'pointer',
  },
  tokenBox: {
    backgroundColor: 'rgba(10, 13, 17, 0.9)',
    border: '1px dashed rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  tokenBoxLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  tokenCode: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: '#38bdf8',
    wordBreak: 'break-all',
  },
  noticeBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    borderRadius: '8px',
    padding: '8px 12px',
    marginBottom: '1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12.5px',
    color: '#bae6fd',
  },
  noticeClose: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '16px',
  },
  tabsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '8px',
    marginBottom: '1rem',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  methodBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10.5px',
    fontWeight: 700,
    borderRadius: '4px',
    padding: '2px 5px',
    border: '1px solid',
  },
  tabTitle: {
    fontSize: '12.5px',
    fontWeight: 600,
  },
  configCard: {
    backgroundColor: 'rgba(18, 22, 29, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '1.25rem',
    marginBottom: '1.25rem',
  },
  configHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  configDescCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  activeMethodBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    fontWeight: 800,
    borderRadius: '5px',
    padding: '3px 8px',
    border: '1px solid',
  },
  activeUrl: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13.5px',
    color: '#f8fafc',
  },
  opDescription: {
    fontSize: '12.5px',
    color: '#94a3b8',
  },
  formGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'flex-end',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    flex: '1 1 180px',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  inputField: {
    backgroundColor: '#0a0d11',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#ffffff',
    outline: 'none',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'border-color 0.15s ease',
  },
  actionCol: {
    flex: '1 1 200px',
    display: 'flex',
  },
  btnExecute: {
    width: '100%',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13.5px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  splitViewer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.25rem',
  },
  inspectorCard: {
    backgroundColor: '#0a0d11',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  inspectorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    backgroundColor: 'rgba(18, 22, 29, 0.95)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  inspectorTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  inspectorDotRequest: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#f59e0b',
  },
  inspectorDotResponse: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  inspectorTitle: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#cbd5e1',
  },
  inspectorTag: {
    fontSize: '10px',
    color: '#64748b',
    fontFamily: "'JetBrains Mono', monospace",
  },
  timestampBadge: {
    fontSize: '10.5px',
    color: '#64748b',
    fontFamily: "'JetBrains Mono', monospace",
  },
  responseMetaGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusPill: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    fontWeight: 700,
    borderRadius: '4px',
    padding: '2px 6px',
    border: '1px solid',
  },
  latencyPill: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: '#94a3b8',
  },
  codeBlockContainer: {
    flex: 1,
    minHeight: '220px',
    maxHeight: '380px',
    overflowY: 'auto',
    padding: '14px',
  },
  codePre: {
    margin: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  rawHttpLine: {
    marginBottom: '6px',
  },
  headerComment: {
    color: '#64748b',
  },
  headerLine: {
    color: '#cbd5e1',
  },
  headerMissingLine: {
    color: '#ef4444',
    fontStyle: 'italic',
    marginTop: '4px',
  },
  bodyDivider: {
    color: '#64748b',
    marginTop: '10px',
    marginBottom: '4px',
    borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
    paddingTop: '6px',
  },
  jsonBodyText: {
    color: '#fed7aa',
  },
  emptyBodyNotice: {
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: '8px',
  },
  jsonResponseText: {
    color: '#a7f3d0',
  },
  placeholderState: {
    color: '#475569',
    fontSize: '12px',
    lineHeight: 1.6,
    paddingTop: '1.5rem',
    textAlign: 'center',
  },
  quickSelectBar: {
    padding: '10px 14px',
    backgroundColor: 'rgba(18, 22, 29, 0.6)',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  quickSelectLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: 600,
  },
  chipsContainer: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  chipButton: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    borderRadius: '4px',
    color: '#38bdf8',
    fontSize: '11px',
    padding: '3px 8px',
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
  },
};
