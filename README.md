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

| Comando                       | Descripción                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `npm run backend:install`     | Instalar las dependencias usando el lockfile del backend.     |
| `npm run backend:start`       | Iniciar el backend en desarrollo con recarga automática.      |
| `npm run backend:start:debug` | Iniciar el backend con depuración y recarga automática.       |
| `npm run backend:build`       | Compilar el backend.                                          |
| `npm run backend:deploy`      | Instalar, compilar y reiniciar el backend con PM2.             |
| `npm run backend:start:prod`  | Ejecutar el backend compilado; requiere compilar previamente. |
| `npm run backend:lint`        | Ejecutar el linter del backend.                               |
| `npm run backend:test`        | Ejecutar las pruebas unitarias del backend.                   |
| `npm run backend:test:e2e`    | Ejecutar las pruebas e2e del backend.                         |
| `npm run backend:db:migrate`  | Ejecutar las migraciones pendientes.                          |
| `npm run backend:db:rollback` | Revertir la última migración.                                 |
| `npm run backend:db:status`   | Consultar el estado de las migraciones.                       |
| `npm run backend:db:seed`     | Reiniciar y cargar los datos de demostración.                 |
| `npm run frontend:install`    | Instalar las dependencias usando el lockfile del frontend.    |
| `npm run frontend:ng -- ...`  | Ejecutar un comando de Angular CLI.                           |
| `npm run frontend:start`      | Iniciar el frontend en desarrollo.                            |
| `npm run frontend:build`      | Compilar el frontend.                                         |
| `npm run frontend:watch`      | Compilar el frontend en modo observación.                     |
| `npm run frontend:test`       | Ejecutar las pruebas del frontend.                            |

Los comandos delegan en `backend/package.json` y `frontend/package.json` mediante `npm --prefix`; el servidor y las herramientas de base de datos leen `backend/.env`.

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
