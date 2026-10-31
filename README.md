Aquí tienes el README completo en formato Markdown puro para pegarlo directamente en el editor de conflictos de GitHub:

```md
# Trabajo Final Integrador — Desarrollo de Aplicaciones Web

Monorepo del sistema de clínica médica.

## Preparar el backend

1. Instalar las dependencias desde la raíz:

   ```bash
   npm run backend:install
   ```

2. Crear `backend/.env` a partir de `backend/.env.example` y configurar la conexión a PostgreSQL, `JWT_SECRET` y `SEED_DEFAULT_PASSWORD`.
3. Ejecutar las migraciones:

   ```bash
   npm run backend:db:migrate
   ```

Para cargar los datos de demostración en una base de desarrollo:

```bash
npm run backend:db:seed
```

La seed reinicia las tablas `usuarios`, `medicos` y `reservas` antes de cargar los datos.

## Comandos desde la raíz

Los nombres siguen el formato `<proyecto>:<acción>[:<variante>]`.

| Comando                        | Descripción                                                       |
| ------------------------------ | ----------------------------------------------------------------- |
| `npm run backend:install`      | Instalar las dependencias usando el lockfile del backend.         |
| `npm run backend:start`        | Iniciar el backend en desarrollo con recarga automática.          |
| `npm run backend:start:debug`  | Iniciar el backend con depuración y recarga automática.           |
| `npm run backend:build`        | Compilar el backend.                                              |
| `npm run backend:deploy`       | Instalar, compilar y reiniciar el backend con PM2.               |
| `npm run backend:start:prod`   | Ejecutar el backend compilado; requiere compilar previamente.     |
| `npm run backend:lint`         | Ejecutar el linter del backend.                                   |
| `npm run backend:test`         | Ejecutar las pruebas unitarias del backend.                       |
| `npm run backend:test:e2e`     | Ejecutar las pruebas e2e del backend.                             |
| `npm run backend:db:migrate`   | Ejecutar las migraciones pendientes.                              |
| `npm run backend:db:rollback`  | Revertir la última migración.                                     |
| `npm run backend:db:status`    | Consultar el estado de las migraciones.                           |
| `npm run backend:db:seed`      | Reiniciar y cargar los datos de demostración.                     |
| `npm run backend:docs`         | Generar la documentación Compodoc del backend.                   |
| `npm run backend:docs:serve`   | Servir la documentación Compodoc del backend (puerto 8080).      |
| `npm run backend:docs:openapi` | Exportar la especificación OpenAPI a `backend/docs/openapi.json`. |
| `npm run frontend:install`     | Instalar las dependencias usando el lockfile del frontend.        |
| `npm run frontend:ng -- ...`   | Ejecutar un comando de Angular CLI.                               |
| `npm run frontend:start`       | Iniciar el frontend en desarrollo con proxy a la API.            |
| `npm run frontend:build`       | Compilar el frontend.                                             |
| `npm run frontend:watch`       | Compilar el frontend en modo observación.                         |
| `npm run frontend:test`        | Ejecutar las pruebas del frontend.                                |
| `npm run frontend:docs`        | Generar la documentación Compodoc del frontend.                  |
| `npm run frontend:docs:serve`  | Servir la documentación Compodoc del frontend (puerto 8081).     |
| `npm run docs`                 | Generar la documentación Compodoc de ambos proyectos.            |

Los comandos delegan en `backend/package.json` y `frontend/package.json` mediante `npm --prefix <proyecto>`, por lo que el servidor y las herramientas de base de datos leen `backend/.env`.

## API y Swagger

El puerto predeterminado es `3000`. Para usar por ejemplo el puerto `8000` y habilitar Swagger, agregar a `backend/.env`:

```env
PORT=8000
SWAGGER_HABILITADO=true
```

Reiniciar el servidor después de modificar el archivo de entorno.

En las siguientes URLs, reemplazar `{PORT}` por el valor de `PORT` configurado en `backend/.env`, o por `3000` si no se define.

- API: `http://localhost:{PORT}/api/v1`.
- Swagger UI: `http://localhost:{PORT}/api`.
- OpenAPI JSON: `http://localhost:{PORT}/api-json`.

## Documentación del código (Compodoc)

Ambos proyectos generan su documentación con [Compodoc](https://compodoc.app) a partir de los comentarios JSDoc del código, con configuración en `backend/.compodocrc.json` y `frontend/.compodocrc.json`.

```bash
npm run docs                 # genera ambas
npm run backend:docs:serve   # http://localhost:8080
npm run frontend:docs:serve  # http://localhost:8081
```

La salida se escribe en `backend/documentation/` y `frontend/documentation/` (ignoradas por git). Para abrirla sin servidor, abrir `documentation/index.html` de cada proyecto en el navegador.

| Proyecto | Qué documenta                                                                                   | Guías                                                                              |
| -------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Backend  | Módulos, controladores, servicios, entidades, DTOs, guards, migración y seeds de NestJS.       | Autenticación y roles · Reglas de negocio de reservas · Base de datos · Swagger      |
| Frontend | Componentes, servicios, guards, interceptor, interfaces y rutas de Angular, con grafo de rutas. | Pantallas, rutas y roles · Sesión y comunicación con la API                        |

Dentro de cada proyecto, `npm run docs:coverage` comprueba la cobertura de comentarios JSDoc y falla si baja del 90 % (no genera la salida HTML).

## Especificación OpenAPI

Con el backend corriendo y `SWAGGER_HABILITADO=true`, `npm run backend:docs:openapi` descarga la especificación y la guarda en `backend/docs/openapi.json`, lista para importar en Postman o Insomnia.
```

Si quieres, te lo dejo también en un bloque listo para pegar como “todo el README” sin backticks, para que lo copies directo en GitHub.Aquí va sin fences, listo para pegar directamente en el editor de conflictos de GitHub:

# Trabajo Final Integrador — Desarrollo de Aplicaciones Web

Monorepo del sistema de clínica médica.

## Preparar el backend

1. Instalar las dependencias desde la raíz:

   ```bash
   npm run backend:install
   ```

2. Crear `backend/.env` a partir de `backend/.env.example` y configurar la conexión a PostgreSQL, `JWT_SECRET` y `SEED_DEFAULT_PASSWORD`.
3. Ejecutar las migraciones:

   ```bash
   npm run backend:db:migrate
   ```

Para cargar los datos de demostración en una base de desarrollo:

```bash
npm run backend:db:seed
```

La seed reinicia las tablas `usuarios`, `medicos` y `reservas` antes de cargar los datos.

## Comandos desde la raíz

Los nombres siguen el formato `<proyecto>:<acción>[:<variante>]`.

| Comando                        | Descripción                                                       |
| ------------------------------ | ----------------------------------------------------------------- |
| `npm run backend:install`      | Instalar las dependencias usando el lockfile del backend.         |
| `npm run backend:start`        | Iniciar el backend en desarrollo con recarga automática.          |
| `npm run backend:start:debug`  | Iniciar el backend con depuración y recarga automática.           |
| `npm run backend:build`        | Compilar el backend.                                              |
| `npm run backend:deploy`       | Instalar, compilar y reiniciar el backend con PM2.               |
| `npm run backend:start:prod`   | Ejecutar el backend compilado; requiere compilar previamente.     |
| `npm run backend:lint`         | Ejecutar el linter del backend.                                   |
| `npm run backend:test`         | Ejecutar las pruebas unitarias del backend.                       |
| `npm run backend:test:e2e`     | Ejecutar las pruebas e2e del backend.                             |
| `npm run backend:db:migrate`   | Ejecutar las migraciones pendientes.                              |
| `npm run backend:db:rollback`  | Revertir la última migración.                                     |
| `npm run backend:db:status`    | Consultar el estado de las migraciones.                           |
| `npm run backend:db:seed`      | Reiniciar y cargar los datos de demostración.                     |
| `npm run backend:docs`         | Generar la documentación Compodoc del backend.                   |
| `npm run backend:docs:serve`   | Servir la documentación Compodoc del backend (puerto 8080).      |
| `npm run backend:docs:openapi` | Exportar la especificación OpenAPI a `backend/docs/openapi.json`. |
| `npm run frontend:install`     | Instalar las dependencias usando el lockfile del frontend.        |
| `npm run frontend:ng -- ...`   | Ejecutar un comando de Angular CLI.                               |
| `npm run frontend:start`       | Iniciar el frontend en desarrollo con proxy a la API.            |
| `npm run frontend:build`       | Compilar el frontend.                                             |
| `npm run frontend:watch`       | Compilar el frontend en modo observación.                         |
| `npm run frontend:test`        | Ejecutar las pruebas del frontend.                                |
| `npm run frontend:docs`        | Generar la documentación Compodoc del frontend.                  |
| `npm run frontend:docs:serve`  | Servir la documentación Compodoc del frontend (puerto 8081).     |
| `npm run docs`                 | Generar la documentación Compodoc de ambos proyectos.            |

Los comandos delegan en `backend/package.json` y `frontend/package.json` mediante `npm --prefix <proyecto>`, por lo que el servidor y las herramientas de base de datos leen `backend/.env`.

## API y Swagger

El puerto predeterminado es `3000`. Para usar por ejemplo el puerto `8000` y habilitar Swagger, agregar a `backend/.env`:

```env
PORT=8000
SWAGGER_HABILITADO=true
```

Reiniciar el servidor después de modificar el archivo de entorno.

En las siguientes URLs, reemplazar `{PORT}` por el valor de `PORT` configurado en `backend/.env`, o por `3000` si no se define.

- API: `http://localhost:{PORT}/api/v1`.
- Swagger UI: `http://localhost:{PORT}/api`.
- OpenAPI JSON: `http://localhost:{PORT}/api-json`.

## Documentación del código (Compodoc)

Ambos proyectos generan su documentación con [Compodoc](https://compodoc.app) a partir de los comentarios JSDoc del código, con configuración en `backend/.compodocrc.json` y `frontend/.compodocrc.json`.

```bash
npm run docs                 # genera ambas
npm run backend:docs:serve   # http://localhost:8080
npm run frontend:docs:serve  # http://localhost:8081
```

La salida se escribe en `backend/documentation/` y `frontend/documentation/` (ignoradas por git). Para abrirla sin servidor, abrir `documentation/index.html` de cada proyecto en el navegador.

| Proyecto | Qué documenta                                                                                   | Guías                                                                              |
| -------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Backend  | Módulos, controladores, servicios, entidades, DTOs, guards, migración y seeds de NestJS.       | Autenticación y roles · Reglas de negocio de reservas · Base de datos · Swagger      |
| Frontend | Componentes, servicios, guards, interceptor, interfaces y rutas de Angular, con grafo de rutas. | Pantallas, rutas y roles · Sesión y comunicación con la API                        |

Dentro de cada proyecto, `npm run docs:coverage` comprueba la cobertura de comentarios JSDoc y falla si baja del 90 % (no genera la salida HTML).

## Especificación OpenAPI

Con el backend corriendo y `SWAGGER_HABILITADO=true`, `npm run backend:docs:openapi` descarga la especificación y la guarda en `backend/docs/openapi.json`, lista para importar en Postman o Insomnia.

Si quieres, te dejo también el contenido final del `package.json` exactamente igual que lo tengo en la rama resuelta.