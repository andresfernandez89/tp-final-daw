# Clínica Médica — Backend (API)

API REST del sistema de gestión de turnos de la clínica médica, construida con **NestJS 12**, **TypeORM** y **PostgreSQL**. Forma parte del Trabajo Final Integrador de Desarrollo de Aplicaciones Web (UNER).

## Funcionalidad

- **Autenticación** con documento y clave; emite un JWT (8 h) con el id y el rol del usuario.
- **Roles**: `PACIENTE`, `MEDICO` y `ADMINISTRADOR`, con autorización por endpoint.
- **Médicos**: listado de médicos activos y modificación del valor de consulta.
- **Pacientes**: consulta de pacientes activos por documento.
- **Reservas**: disponibilidad por médico y fecha, creación, cancelación con plazos por rol, registro de atención/ausencia por el médico y listados por rol.

Las reglas de negocio están descritas en las guías _Autenticación y roles_ y _Reglas de negocio de reservas_.

## Estructura

```
src/
├── main.ts                 Bootstrap, prefijo /api, versionado /v1, validación, Swagger
├── app.module.ts           Módulo raíz: configuración, TypeORM y módulos funcionales
├── common/dtos/            DTOs compartidos (ErrorResponseDto)
├── database/
│   ├── data-source.ts      DataSource del CLI de TypeORM
│   ├── migrations/         Migraciones del esquema
│   └── seeds/              Datos de demostración
└── modules/
    ├── auth/               Login, JwtModule, AuthGuard, RolesGuard, @Roles
    ├── users/              Entidad User (usuarios)
    ├── doctors/            Entidad Doctor (medicos), listado y arancel
    ├── patients/           Consulta de pacientes
    └── reservations/       Entidad Reservation (reservas) y reglas de turnos
```

Cada módulo sigue la misma convención: `controllers/`, `services/`, `dtos/input`, `dtos/output`, `entities/`, `enums/`, `guards/`.

## Puesta en marcha

```bash
npm ci
cp .env.example .env        # completar DB_*, JWT_SECRET, SEED_DEFAULT_PASSWORD
npm run db:migrate
npm run db:seed             # opcional: datos de demostración
npm run start:dev
```

Variables de entorno: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DB_LOGGING`, `JWT_SECRET`, `SEED_DEFAULT_PASSWORD`, `PORT` (3000) y `SWAGGER_HABILITADO`.

## Comandos

| Comando                 | Descripción                                              |
| ----------------------- | -------------------------------------------------------- |
| `npm run start:dev`     | Servidor en desarrollo con recarga automática.           |
| `npm run build`         | Compila a `dist/`.                                       |
| `npm run start:prod`    | Ejecuta `dist/main`.                                     |
| `npm run lint`          | Linter (oxlint).                                         |
| `npm run format`        | Prettier sobre `src/` y `test/`.                         |
| `npm run test`          | Pruebas unitarias (Vitest).                              |
| `npm run test:e2e`      | Pruebas end-to-end.                                      |
| `npm run db:migrate`    | Ejecuta las migraciones pendientes.                      |
| `npm run db:rollback`   | Revierte la última migración.                            |
| `npm run db:status`     | Estado de las migraciones.                               |
| `npm run db:seed`       | Reinicia y carga los datos de demostración.              |
| `npm run db:seed:today` | Crea turnos de hoy para probar la agenda del médico.     |
| `npm run docs:build`    | Genera la documentación Compodoc en `documentation/`.    |
| `npm run docs:serve`    | Sirve Compodoc en `http://localhost:8080` con recarga.   |
| `npm run docs:coverage` | Comprueba la cobertura de documentación (mínimo 90 %).   |
| `npm run docs:openapi`  | Exporta la especificación OpenAPI a `docs/openapi.json`. |

## Documentación

- **Swagger UI**: con `SWAGGER_HABILITADO=true`, en `http://localhost:{PORT}/api`; especificación JSON en `/api-json`. Ver la guía _Swagger y OpenAPI_.
- **Compodoc**: `npm run docs:build` genera la documentación del código (módulos, controladores, servicios, entidades, DTOs, guards) con las guías de `docs/` en `documentation/index.html`.
