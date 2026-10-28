export const preguntasClases = {
  'indices-btree': {
    question: '¿Por qué un índice B-Tree en PostgreSQL permite encontrar una fila entre un millón en menos de 1 milisegundo?',
    answers: [
      'Porque recorre la estructura en tiempo logarítmico O(log N), leyendo solo 3 o 4 páginas de disco en lugar de escanear la tabla completa',
      'Porque almacena toda la tabla en la memoria RAM del navegador',
      'Porque convierte la consulta SQL en un script de bash',
    ],
    correct: 0,
    explanation: 'Un índice B-Tree organiza las claves de forma balanceada. El motor recorre el nodo raíz, una rama intermedia y una hoja, obteniendo el puntero TID de la tupla con solo 3 o 4 lecturas de buffers de 8 KB.',
  },
  graphql: {
    question: '¿Qué problema fundamental de las APIs REST resuelve GraphQL al permitir que el cliente especifique exactamente los campos que necesita?',
    answers: [
      'El problema de Over-fetching (recibir campos innecesarios) y Under-fetching (hacer múltiples llamadas para datos relacionados)',
      'La necesidad de tener una base de datos relacional',
      'La obligación de cifrar las conexiones con certificados SSL',
    ],
    correct: 0,
    explanation: 'GraphQL permite solicitar exactamente los datos requeridos en una única petición HTTP POST, evitando transferir kilobytes de datos no deseados y reduciendo los viajes de red (round-trips).',
  },
  'rate-limit': {
    question: '¿Qué cabecera HTTP estándar y código de respuesta usa el servidor para indicar que se superó el límite de peticiones y cuándo reintentar?',
    answers: [
      'Código 429 Too Many Requests con la cabecera Retry-After',
      'Código 404 Not Found con la cabecera Cache-Control',
      'Código 500 Internal Server Error con la cabecera Connection: close',
    ],
    correct: 0,
    explanation: 'El estándar RFC 6585 define el estado 429 Too Many Requests, y la cabecera Retry-After le comunica al cliente cuántos segundos debe esperar antes de volver a consultar.',
  },
  'jwt-inseguro': {
    question: '¿Qué impide que alguien cambie el rol del payload de un JWT y el servidor lo acepte?',
    answers: [
      'Verificar la firma con una clave secreta fuerte y algoritmos permitidos',
      'Ocultar el payload con Base64',
      'Cambiar el nombre del campo «rol»',
    ],
    correct: 0,
    explanation: 'Base64 solo codifica el contenido. La firma permite detectar cambios y debe validarse con una clave fuerte y una lista explícita de algoritmos.',
  },
  'path-traversal': {
    question: '¿Cuál es la defensa central contra Path Traversal al leer un archivo solicitado?',
    answers: [
      'Eliminar todos los puntos del nombre',
      'Resolver la ruta y comprobar que permanezca dentro del directorio permitido',
      'Cambiar la extensión del archivo a .txt',
    ],
    correct: 1,
    explanation: 'La ruta final debe resolverse y compararse con el directorio base antes de abrir el archivo. Filtrar solo «..» no cubre todas las variantes.',
  },
  cors: {
    question: '¿Qué controla CORS en una petición entre dos sitios?',
    answers: [
      'Si el navegador permite al JavaScript del sitio solicitante leer la respuesta',
      'Si el servidor requiere contraseña',
      'Si la petición viaja cifrada por HTTPS',
    ],
    correct: 0,
    explanation: 'CORS es una regla que el navegador aplica al acceso a la respuesta. No reemplaza la autenticación ni cifra la conexión.',
  },
  csrf: {
    question: '¿Por qué un token CSRF aleatorio ayuda a proteger una transferencia?',
    answers: [
      'Porque el navegador nunca envía cookies a otros sitios',
      'Porque el sitio atacante no puede leer ni adivinar el token válido requerido por el servidor',
      'Porque el token cifra todo el contenido de la petición',
    ],
    correct: 1,
    explanation: 'El navegador puede adjuntar cookies automáticamente. El token añade una prueba que el sitio externo no puede obtener por la política de mismo origen.',
  },
  'sql-injection': {
    question: '¿Qué hace que una consulta parametrizada frene la inyección SQL?',
    answers: [
      'Separa los valores del texto SQL para que se interpreten como datos',
      'Borra del input todas las letras',
      'Oculta la consulta al navegador',
    ],
    correct: 0,
    explanation: 'Con parámetros como $1, el motor recibe la consulta y el valor por separado. El contenido del usuario no se convierte en instrucciones SQL.',
  },
  xss: {
    question: '¿Cuál es la diferencia segura que muestra la simulación al renderizar texto?',
    answers: [
      'innerHTML siempre convierte el contenido en texto plano',
      'textContent muestra el contenido como texto en vez de interpretarlo como HTML',
      'Cambiar el color del texto evita que se ejecute código',
    ],
    correct: 1,
    explanation: 'innerHTML interpreta etiquetas; textContent las inserta como texto. Para contenido no confiable, evita que el navegador lo trate como marcado ejecutable.',
  },
  'password-hashing': {
    question: '¿Por qué se almacena una contraseña con bcrypt y salt en vez de guardarla directamente?',
    answers: [
      'Para poder recuperar la contraseña original más rápido',
      'Para que cada contraseña tenga un hash costoso de comprobar y distinto aunque se repita',
      'Para que el navegador no envíe la contraseña',
    ],
    correct: 1,
    explanation: 'Un hash adaptativo con salt dificulta ataques de diccionario y evita hashes iguales para contraseñas repetidas. No es cifrado reversible.',
  },
  'ssr-vs-csr': {
    question: '¿Qué ocurre primero en el flujo SSR de esta simulación?',
    answers: [
      'El servidor arma el HTML con el contenido y luego lo envía al navegador',
      'El navegador descarga la app vacía y siempre espera a ejecutar JavaScript',
      'La base de datos dibuja la página directamente en pantalla',
    ],
    correct: 0,
    explanation: 'En SSR el servidor genera HTML para la petición. En CSR el navegador suele descargar y ejecutar JavaScript antes de construir la vista con los datos.',
  },
  colas: {
    question: '¿Para qué sirve la cola entre un productor y un consumidor?',
    answers: [
      'Para que el productor entregue trabajos y el consumidor los procese sin bloquear la petición original',
      'Para guardar contraseñas en el navegador',
      'Para ordenar visualmente los mensajes en pantalla',
    ],
    correct: 0,
    explanation: 'La cola desacopla a quien crea el trabajo de quien lo procesa. El consumidor puede avanzar a su ritmo y reintentar tareas según la política.',
  },
  transacciones: {
    question: '¿Qué diferencia hay entre COMMIT y ROLLBACK en la transferencia simulada?',
    answers: [
      'COMMIT guarda los cambios; ROLLBACK los revierte si la operación falla',
      'COMMIT crea una copia; ROLLBACK borra la base entera',
      'Ambos dejan guardados los cambios parciales',
    ],
    correct: 0,
    explanation: 'La transacción agrupa cambios relacionados. COMMIT confirma todo; ante un error, ROLLBACK restaura el estado previo.',
  },
  api: {
    question: 'En el recorrido de una API, ¿qué hace el servidor después de recibir y validar la petición?',
    answers: [
      'Ejecuta la lógica necesaria, consulta los datos y prepara una respuesta HTTP',
      'Envía la petición de vuelta sin procesarla',
      'El navegador inserta los datos directamente en la base',
    ],
    correct: 0,
    explanation: 'La ruta recibe la petición, aplica validaciones y coordina la lógica y el acceso a datos antes de responder con un estado y contenido.',
  },
  'cache-redis': {
    question: '¿Qué significa un MISS seguido por un HIT en la simulación de Redis?',
    answers: [
      'MISS consulta el origen y guarda el resultado; HIT lo encuentra en caché',
      'MISS significa que Redis eliminó la base de datos',
      'HIT significa que el servidor rechaza la petición',
    ],
    correct: 0,
    explanation: 'En el primer MISS se busca el dato en la base y se guarda temporalmente. Las consultas siguientes pueden responder desde Redis hasta que expire el TTL.',
  },
  database: {
    question: '¿Para qué sirve un índice en una base de datos?',
    answers: [
      'Para ayudar a encontrar filas sin revisar toda la tabla en cada consulta',
      'Para duplicar automáticamente todas las filas',
      'Para convertir SQL en una API HTTP',
    ],
    correct: 0,
    explanation: 'El índice mantiene una estructura auxiliar que acelera búsquedas seleccionadas, aunque ocupa espacio y debe actualizarse al cambiar datos.',
  },
  recursividad: {
    question: '¿Qué evita que las llamadas recursivas continúen para siempre?',
    answers: [
      'El caso base, que resuelve el problema sin volver a llamarse',
      'El nombre de la función',
      'Una variable global que borra la pila',
    ],
    correct: 0,
    explanation: 'Cada llamada reduce el problema hasta alcanzar el caso base. Luego los resultados regresan por la pila de llamadas.',
  },
  algoritmo: {
    question: 'En Selection Sort, ¿qué hace cada pasada principal?',
    answers: [
      'Busca el menor elemento restante y lo coloca en la siguiente posición ordenada',
      'Mezcla todos los elementos al azar',
      'Compara solo el primer y el último elemento',
    ],
    correct: 0,
    explanation: 'Selection Sort mantiene una parte ordenada y, en cada pasada, selecciona el menor valor de la parte restante para ubicarlo al final de la zona ordenada.',
  },
  servidor: {
    question: '¿Qué representa el ciclo de vida de una petición en el servidor?',
    answers: [
      'Recibirla, procesarla, consultar servicios si hace falta y devolver una respuesta',
      'Reiniciar el servidor después de cada clic',
      'Mover datos directamente desde el cliente a Redis sin validarlos',
    ],
    correct: 0,
    explanation: 'El servidor acepta la conexión, ejecuta middleware y rutas, puede usar base de datos o caché y finalmente responde al cliente.',
  },
  github: {
    question: '¿Qué diferencia hay entre commit y push en el flujo Git?',
    answers: [
      'Commit guarda un snapshot local; push lo envía al repositorio remoto',
      'Commit publica la página; push instala Git',
      'Son dos nombres para borrar cambios locales',
    ],
    correct: 0,
    explanation: 'Un commit registra cambios en el historial local. Push sincroniza esos commits con una rama del repositorio remoto.',
  },
  bots: {
    question: '¿Qué efecto tiene el rate limiting frente a la ráfaga de bots?',
    answers: [
      'Limita solicitudes por ventana y responde 429 cuando se supera el umbral',
      'Aumenta el CPU para procesar todos los pedidos',
      'Cambia automáticamente las direcciones IP de los usuarios legítimos',
    ],
    correct: 0,
    explanation: 'El límite frena peticiones repetidas antes de que saturen la aplicación y permite que el servidor siga atendiendo tráfico legítimo.',
  },
  docker: {
    question: '¿Qué relación muestra Docker entre una imagen y un contenedor?',
    answers: [
      'La imagen es la plantilla; el contenedor es una instancia ejecutándose',
      'El contenedor es el archivo fuente que crea una imagen del navegador',
      'La imagen solo guarda logs y no puede ejecutarse',
    ],
    correct: 0,
    explanation: 'Docker construye una imagen a partir de instrucciones y archivos. Luego ejecuta esa imagen como uno o más contenedores aislados.',
  },
  http: {
    question: '¿Qué agrega HTTPS sobre HTTP?',
    answers: [
      'Cifrado TLS y autenticación del servidor para proteger el tráfico en tránsito',
      'Una garantía de que el servidor no tiene bugs',
      'Una base de datos dentro del navegador',
    ],
    correct: 0,
    explanation: 'HTTPS usa TLS para proteger la comunicación y validar la identidad del servidor. No garantiza que la aplicación sea segura por sí sola.',
  },
  dns: {
    question: '¿Qué tarea cumple DNS antes de que el navegador se conecte a un dominio?',
    answers: [
      'Busca la dirección asociada al nombre de dominio',
      'Cifra el contenido de la página',
      'Verifica la contraseña del usuario',
    ],
    correct: 0,
    explanation: 'DNS traduce nombres como ejemplo.com a registros que permiten localizar el servidor, normalmente una dirección IP.',
  },
  websockets: {
    question: '¿Qué distingue a WebSockets de una secuencia tradicional de peticiones HTTP?',
    answers: [
      'Mantiene una conexión abierta para intercambiar mensajes en ambas direcciones',
      'Solo permite descargar una imagen por conexión',
      'Requiere recargar la página para cada mensaje',
    ],
    correct: 0,
    explanation: 'Tras el handshake, cliente y servidor pueden enviarse mensajes por la conexión persistente sin iniciar una petición HTTP nueva por cada evento.',
  },
  'ci-cd': {
    question: '¿Por qué el despliegue del pipeline espera a que pasen las validaciones?',
    answers: [
      'Para evitar publicar una versión que no superó los pasos de comprobación',
      'Para que el runner permanezca encendido para siempre',
      'Para reemplazar el control de versiones',
    ],
    correct: 0,
    explanation: 'CI ejecuta verificaciones en cambios del repositorio. CD puede publicar el artefacto cuando los pasos previos terminan correctamente.',
  },
};
