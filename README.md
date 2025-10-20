# PetCare API

API REST Express + MongoDB para gestionar mascotas. Incluye scripts Docker, balanceo con Nginx y logs enriquecidos.

## Requisitos
- Node.js 20+
- Docker (opcional pero recomendado)
- MongoDB accesible (local o remoto) con la base `petcare`

## Configuración de entorno
1. Duplica la plantilla:
   ```bash
   cd app-petcare
   cp .env.example .env
   ```
2. Ajusta las variables:
   - Usa las credenciales por defecto (`petcare_app` / `petcare_pass`) si levantarás la base con Docker.
   - Define `INSTANCE` para identificar la instancia en el endpoint `/ping`.
   - Cambia `MONGODB_URI`, `MONGODB_USER`, `MONGODB_PASS` y `MONGODB_AUTH_SOURCE` según tu base externa (si el URI ya incorpora usuario y contraseña puedes dejar esos campos vacíos).

## Bases de datos con Docker (opcional)
Inicia un MongoDB autenticado con el usuario de aplicación preconfigurado:
```bash
docker run -d --name petcare-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=adminpass \
  -e MONGO_INITDB_DATABASE=petcare \
  -v $(pwd)/docker/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro \
  mongo:7
```
El script `docker/mongo-init.js` crea el usuario `petcare_app` con `readWrite` sobre `petcare`. Cuando termines elimina el contenedor con:
```bash
docker rm -f petcare-mongo
```

## Ejecución local
```bash
npm install              # o npm install --prefix app-petcare
npm start                # inicia la API (puerto 3000 por defecto)
```
Comprueba el estado con `GET /health` o `GET /ping`. Si aparece `codeName: Unauthorized`, revisa credenciales y permisos en tu MongoDB.

## Docker Compose (una instancia)
```bash
docker compose up --build -d   # levanta Mongo + API (puerto 3000)
curl http://localhost:3000/health
docker compose down -v         # detiene y limpia
```
Contenedores resultantes:
- `petcare-mongo-compose`
- `petcare-api`

## Docker Compose (tres instancias + Nginx)
```bash
docker compose -f compose-instancias.yml up --build -d   # expone Nginx en 8080
curl http://localhost:8080/ping
docker compose -f compose-instancias.yml down -v
```
Nginx usa `least_conn` para balancear `petcare-api-{1,2,3}` según `nginx/nginx.conf`.

## Makefile
```bash
make dev           # npm run dev (nodemon) dentro de app-petcare
make compose-up    # docker compose up -d
make compose-down  # docker compose down
```

## Endpoints principales
- `GET /ping` → `{ ok: true, instance, pid }` (ayuda a identificar la instancia que respondió).
- `GET /health` → estado general.
- `/pets` → CRUD completo (POST, GET, GET/:id, PUT/:id, PATCH/:id, DELETE/:id).

## Logs
- Inicio del servidor: detalles de conexión a MongoDB y banner de disponibilidad.
- CRUD de mascotas: logs con nivel `INFO`/`SUCCESS`/`WARN` y metadatos clave.
- Errores: mensajes estructurados con `WARN` o `ERROR` y stack trace cuando corresponde.

Ejemplo:
```text
2024-05-10T15:00:00.123Z │ INFO               │ Pet listing retrieved.
    -> {
    ->   "count": 2,
    ->   "total": 5,
    ->   "page": 1,
    ->   "limit": 25
    -> }
====================================================
==  PetCare API ready on port 3000  ==
====================================================
```
