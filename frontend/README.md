# Clínica Médica — Frontend

Aplicación web del sistema de gestión de turnos de la clínica médica, construida con **Angular 21** (componentes standalone, signals) y **PrimeNG**. Forma parte del Trabajo Final Integrador de Desarrollo de Aplicaciones Web (UNER). Consume la API del backend de este monorepo.

## Pantallas

| Ruta              | Pantalla            | Roles                     |
| ----------------- | ------------------- | ------------------------- |
| `/login`          | Inicio de sesión    | Público                   |
| `/turnos`         | Reservas / agenda   | Todos (contenido por rol) |
| `/reservar-turno` | Nueva reserva       | Paciente, administrador   |
| `/medicos`        | Valores de consulta | Administrador             |

El detalle de cada pantalla, los guards y las reglas replicadas en el cliente está en la guía _Pantallas, rutas y roles_; el manejo de la sesión y del token, en _Sesión y comunicación con la API_.

## Estructura

```
src/
├── main.ts                 Bootstrap de la aplicación standalone
├── proxy.conf.mjs          Proxy de desarrollo /api -> backend
└── app/
    ├── app.ts / app.config.ts / app.routes.ts
    ├── core/api.config.ts  URL base de la API (/api/v1)
    ├── auth/               AuthStore, guards, interceptor, cliente y pantalla de login
    ├── template/           Layout (encabezado y navegación)
    ├── reservations/       Pantalla de turnos y de nueva reserva, con sus clientes
    ├── doctors/            Pantalla de valores de consulta y su cliente
    └── shared/             Formateadores y pantalla 404
```

## Puesta en marcha

```bash
npm ci
npm start                   # http://localhost:4200, proxy /api -> backend
```

El proxy apunta a `http://localhost:{PORT}` leyendo `PORT` de `../backend/.env` (3000 por defecto); se puede forzar con la variable de entorno `BACKEND_URL`.

## Comandos

| Comando                 | Descripción                                            |
| ----------------------- | ------------------------------------------------------ |
| `npm start`             | Servidor de desarrollo con proxy a la API.             |
| `npm run build`         | Compilación de producción en `dist/`.                  |
| `npm run watch`         | Compilación de desarrollo con recarga.                 |
| `npm test`              | Pruebas unitarias (Vitest).                            |
| `npm run docs:build`    | Genera la documentación Compodoc en `documentation/`.  |
| `npm run docs:serve`    | Sirve Compodoc en `http://localhost:8081` con recarga. |
| `npm run docs:coverage` | Comprueba la cobertura de documentación (mínimo 90 %). |

## Documentación

`npm run docs:build` genera con **Compodoc** la documentación del código (componentes, servicios, guards, interceptor, interfaces y rutas, con grafo de dependencias) junto con las guías de `docs/`, en `documentation/index.html`.
