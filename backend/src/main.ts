import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

/**
 * Punto de entrada del backend.
 *
 * Crea la aplicación Nest, aplica cabeceras de seguridad (helmet), el prefijo
 * global `api`, el versionado por URI (`/api/v1/...`) y la validación global de
 * DTOs. Si la variable de entorno `SWAGGER_HABILITADO` vale `true`, publica la
 * documentación OpenAPI en `/api` (Swagger UI) y `/api-json` (especificación).
 *
 * El puerto se toma de `PORT` y, si no está definido, se usa `3000`.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (process.env.SWAGGER_HABILITADO === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Sistema de Clínica Médica')
      .setDescription(
        'API REST del sistema de gestión de turnos de la clínica médica ' +
          '(Trabajo Final Integrador — Desarrollo de Aplicaciones Web, UNER).\n\n' +
          '**Autenticación.** Todos los endpoints, salvo `POST /auth/login`, requieren ' +
          'un token JWT en la cabecera `Authorization: Bearer <token>`. El token se ' +
          'obtiene al iniciar sesión con documento y clave, y expira a las 8 horas.\n\n' +
          '**Roles.** Cada usuario tiene un único rol: `PACIENTE`, `MEDICO` o ' +
          '`ADMINISTRADOR`. Cada operación indica los roles autorizados; un rol no ' +
          'permitido recibe `403 Forbidden`.\n\n' +
          '**Zona horaria.** Los horarios de los turnos se expresan en la hora de ' +
          'Buenos Aires (`America/Argentina/Buenos_Aires`, UTC-03:00). Los turnos duran ' +
          'una hora y comienzan entre las 08:00 y las 15:00.\n\n' +
          '**Errores.** Las respuestas de error siguen el formato estándar de NestJS: ' +
          '`{ statusCode, message, error }`. En los errores de validación `message` ' +
          'es un arreglo con un detalle por campo.',
      )
      .setVersion('1.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Token de acceso devuelto por `POST /auth/login`. Pegar sólo el token, sin el prefijo `Bearer`.',
      })
      .addTag(
        'Autenticación',
        'Inicio de sesión y emisión del token de acceso.',
      )
      .addTag(
        'Médicos',
        'Listado de médicos activos y administración del valor de consulta.',
      )
      .addTag(
        'Pacientes',
        'Consulta de pacientes activos (sólo administradores).',
      )
      .addTag(
        'Reservas',
        'Disponibilidad, creación, cancelación, atención y listados de turnos.',
      )
      .build();
    const documentFactory = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(globalPrefix, app, documentFactory, {
      customSiteTitle: 'API — Sistema de Clínica Médica',
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'method',
        displayRequestDuration: true,
      },
    });
  }
  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
