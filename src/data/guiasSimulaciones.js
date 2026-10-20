export const guiasSimulaciones = {
  'jwt-inseguro': {
    steps: ['Dejá seleccionado Secreto débil y observá que el rol inicial es user.', 'Presioná Intentar forjar admin y compará el resultado con Algoritmo none y Modo seguro.'],
    observe: 'El payload se puede leer; la firma debe detectar cambios. En los modos vulnerables el servidor acepta una firma débil o ausente, mientras que el seguro rechaza la alteración.',
  },
  'path-traversal': {
    steps: ['Probá reporte.txt para leer un archivo permitido.', 'Pegá ../secreto-simulado.txt en modo vulnerable y repetí en modo seguro.'],
    observe: 'Compará la ruta resuelta y el contenido. El modo seguro debe impedir que la ruta salga del directorio permitido.',
  },
  cors: {
    steps: ['Ejecutá fetch desde la pestaña RunLearn.', 'Probá desde el sitio externo y cambiá entre modo restrictivo y abierto.'],
    observe: 'Mirá Access-Control-Allow-Origin y si el navegador entrega la respuesta al JavaScript. CORS regula lectura en el navegador; no autentica usuarios.',
  },
  csrf: {
    steps: ['Iniciá sesión en el banco de prueba para crear una sesión.', 'Desde el sitio malicioso, presioná Reclamar premio en modo vulnerable y luego en modo seguro.'],
    observe: 'Compará el saldo y los movimientos. El servidor seguro exige un token que el sitio externo no puede leer.',
  },
  'sql-injection': {
    steps: ['Buscá Ada Lovelace para ver una consulta normal.', 'Probá el payload sugerido y compará modo vulnerable con modo seguro.'],
    observe: 'Revisá la consulta construida y cuántas filas devuelve. Los parámetros mantienen el input separado del código SQL.',
  },
  xss: {
    steps: ['Escribí texto normal y presioná Renderizar.', 'Probá el payload de ejemplo y alterná entre innerHTML vulnerable y textContent seguro.'],
    observe: 'Comprobá si el navegador interpreta las etiquetas como HTML o las muestra literalmente como texto.',
  },
  'password-hashing': {
    steps: ['Escribí una contraseña de prueba para comparar texto plano y hash.', 'Ejecutá la demostración de fuerza bruta y observá cómo cambia el costo con bcrypt.'],
    observe: 'Un hash no se descifra para recuperar la contraseña. El salt evita hashes repetidos y bcrypt hace más costosas las pruebas masivas.',
  },
  'ssr-vs-csr': {
    steps: ['Ejecutá la carga en modo SSR.', 'Reiniciá, elegí CSR y ejecutá de nuevo.'],
    observe: 'Compará cuándo aparece el contenido y cuándo llega el HTML con datos. Cada modo reparte el trabajo entre servidor y navegador de forma distinta.',
  },
  colas: {
    steps: ['Iniciá la simulación para producir y consumir tareas.', 'Mové la velocidad del productor y consumidor; pausá cuando la cola tenga tareas pendientes.'],
    observe: 'Si se producen tareas más rápido de lo que se procesan, crece la cola. La cola absorbe picos, pero tiene capacidad limitada.',
  },
  transacciones: {
    steps: ['Ejecutá una transferencia exitosa.', 'Reiniciá y forzá un error para comparar COMMIT con ROLLBACK.'],
    observe: 'Los saldos deben cambiar juntos o volver al estado inicial: una transacción evita dejar una operación a medias.',
  },
  api: {
    steps: ['Presioná Simular funcionamiento y seguí el paquete por cliente, API y base de datos.', 'Avanzá hasta la respuesta y mirá qué línea de código se ejecuta en cada paso.'],
    observe: 'Una API recibe una petición, ejecuta una ruta y devuelve un estado HTTP con datos; el navegador no escribe directamente en la base.',
  },
  'cache-redis': {
    steps: ['Consultá un dato una vez para provocar un MISS.', 'Volvé a consultar la misma clave antes de que expire el TTL.'],
    observe: 'En un MISS se consulta la base y se guarda el resultado; en un HIT se responde desde Redis. Cuando expira el TTL vuelve a consultarse el origen.',
  },
  database: {
    steps: ['Presioná Simular funcionamiento y recorré la consulta hasta la tabla.', 'Observá qué trabajo hace el índice antes de devolver las filas.'],
    observe: 'La consulta pide datos; el índice ayuda a localizar filas y el motor devuelve solo el resultado solicitado.',
  },
  recursividad: {
    steps: ['Elegí un n pequeño y presioná Simular funcionamiento.', 'Seguí las llamadas hasta el caso base y después los retornos.'],
    observe: 'El caso base detiene nuevas llamadas. La pila conserva cada operación pendiente hasta que vuelven los resultados.',
  },
  algoritmo: {
    steps: ['Presioná Simular funcionamiento o Paso a paso.', 'Seguí cómo se busca el menor valor y se intercambia con el primer lugar no ordenado.'],
    observe: 'La parte ordenada crece de izquierda a derecha. Selection Sort revisa los valores restantes para elegir el siguiente mínimo.',
  },
  servidor: {
    steps: ['Presioná Simular ciclo de vida y recorré el flujo.', 'Observá la petición, el trabajo del servidor y la respuesta final.'],
    observe: 'El servidor recibe solicitudes, ejecuta middleware y rutas, consulta dependencias cuando hace falta y devuelve una respuesta.',
  },
  github: {
    steps: ['Presioná Simular flujo Git.', 'Seguí los cambios desde el directorio de trabajo hasta commit y push.'],
    observe: 'Commit guarda un punto del historial local; push publica esos commits en el repositorio remoto.',
  },
  bots: {
    steps: ['Ejecutá la ráfaga sin protección.', 'Repetí con rate limiting y compará solicitudes aceptadas, bloqueadas y estado del servidor.'],
    observe: 'El límite por ventana responde 429 al exceso y evita que todas las solicitudes lleguen a la lógica de la aplicación.',
  },
  docker: {
    steps: ['Presioná Simular funcionamiento.', 'Seguí cómo el Dockerfile construye una imagen y cómo esa imagen inicia un contenedor.'],
    observe: 'La imagen es la plantilla reproducible; el contenedor es el proceso aislado que la ejecuta.',
  },
  http: {
    steps: ['Animá el flujo HTTP y observá la petición.', 'Animá HTTPS y compará el canal cifrado y la verificación del servidor.'],
    observe: 'HTTP transmite datos sin cifrado TLS; HTTPS protege el tráfico en tránsito, pero no corrige fallas de la aplicación.',
  },
  dns: {
    steps: ['Avanzá por cada paso con Siguiente paso.', 'Seguí la consulta desde el nombre de dominio hasta la respuesta del resolver.'],
    observe: 'DNS resuelve nombres a registros que permiten localizar servicios; no cifra el contenido de la página.',
  },
  websockets: {
    steps: ['Avanzá hasta completar el handshake.', 'Observá el intercambio de mensajes en ambas direcciones por la conexión abierta.'],
    observe: 'WebSockets mantienen un canal persistente para enviar eventos sin crear una petición HTTP nueva por cada mensaje.',
  },
  'ci-cd': {
    steps: ['Avanzá por el pipeline paso a paso.', 'Observá que la publicación ocurre después de instalar, compilar y validar.'],
    observe: 'La automatización ejecuta comprobaciones repetibles y detiene el despliegue si falla un paso previo.',
  },
};
