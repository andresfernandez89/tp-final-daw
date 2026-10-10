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
| `npm run backend:start:prod`  | Ejecutar el backend compilado; requiere compilar previamente. |
| `npm run backend:lint`        | Ejecutar el linter del backend.                               |
| `npm run backend:test`        | Ejecutar las pruebas unitarias del backend.                   |
| `npm run backend:test:e2e`    | Ejecutar las pruebas e2e del backend.                         |
| `npm run backend:db:migrate`  | Ejecutar las migraciones pendientes.                          |
| `npm run backend:db:rollback` | Revertir la última migración.                                 |
| `npm run backend:db:status`   | Consultar el estado de las migraciones.                       |
| `npm run backend:db:seed`     | Reiniciar y cargar los datos de demostración.                 |

Los comandos delegan en `backend/package.json` mediante `npm --prefix backend`, por lo que el servidor y las herramientas de base de datos leen `backend/.env`.

## API y Swagger

El puerto predeterminado es `3000`. Para usar por ejemplo el puerto `8000` y habilitar Swagger, agregar a `backend/.env`:

```env
PORT=8000
SWAGGER_HABILITADO=true
```

Reiniciar el servidor después de modificar el archivo de entorno.

- API: `http://localhost:9191/api/v1`.
- Swagger UI: `http://localhost:9191/api`.
- OpenAPI JSON: `http://localhost:9191/api-json`.
