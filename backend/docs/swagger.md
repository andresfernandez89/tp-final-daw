# Swagger y OpenAPI

La documentación interactiva de la API se genera con `@nestjs/swagger` a partir de los decoradores de los controladores y DTOs (`@ApiTags`, `@ApiOperation`, `@ApiProperty`, `@ApiXxxResponse`, etc.). La configuración está en `src/main.ts`.

## Habilitar

En `backend/.env`:

```env
SWAGGER_HABILITADO=true
```

Con el servidor corriendo (`npm run start:dev`), reemplazando `{PORT}` por el valor de `PORT` (o `3000`):

| Recurso        | URL                                |
| -------------- | ---------------------------------- |
| Swagger UI     | `http://localhost:{PORT}/api`      |
| OpenAPI (JSON) | `http://localhost:{PORT}/api-json` |
| OpenAPI (YAML) | `http://localhost:{PORT}/api-yaml` |
| API            | `http://localhost:{PORT}/api/v1`   |

## Probar endpoints protegidos

1. Ejecutar `POST /auth/login` desde Swagger UI con un documento y clave válidos.
2. Copiar el `accessToken` de la respuesta.
3. Pulsar **Authorize** (candado) y pegar el token, sin el prefijo `Bearer`.
4. La autorización persiste al recargar la página (`persistAuthorization`).

## Exportar la especificación

Con el servidor corriendo y Swagger habilitado:

```bash
npm run docs:openapi
```

Guarda la especificación en `docs/openapi.json`. Se puede importar en Postman, Insomnia o cualquier generador de clientes. La URL base se puede cambiar con la variable `API_URL` (por defecto `http://localhost:{PORT}`).

## Convenciones

- Cada operación declara los roles autorizados en su descripción y los códigos de error posibles, con el esquema `ErrorResponseDto` como cuerpo.
- Los DTOs de entrada llevan las validaciones de `class-validator` reflejadas en el esquema (`minimum`, `pattern`, `enum`, …) y un `example`.
- Las etiquetas (`Autenticación`, `Médicos`, `Pacientes`, `Reservas`) coinciden con los módulos de Nest.
