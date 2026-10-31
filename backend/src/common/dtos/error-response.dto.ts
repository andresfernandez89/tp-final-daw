import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Cuerpo estándar de las respuestas de error de la API.
 *
 * Es el formato que produce NestJS para cualquier `HttpException`
 * (400, 401, 403, 404, 409, 500, etc.). Se usa únicamente para documentar
 * en Swagger la forma de los errores; no se instancia en el código.
 */
export class ErrorResponseDto {
  /** Código de estado HTTP de la respuesta. */
  @ApiProperty({
    type: 'integer',
    description: 'Código de estado HTTP.',
    example: 400,
  })
  statusCode: number;

  /**
   * Mensaje descriptivo del error. En los errores de validación del
   * `ValidationPipe` es un arreglo con un mensaje por regla incumplida.
   */
  @ApiProperty({
    description:
      'Mensaje del error. En errores de validación es un arreglo de mensajes.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'El horario seleccionado ya está ocupado.',
  })
  message: string | string[];

  /** Nombre corto del tipo de error HTTP (por ejemplo `Bad Request`). */
  @ApiPropertyOptional({
    description: 'Nombre del tipo de error HTTP.',
    example: 'Bad Request',
  })
  error?: string;
}
