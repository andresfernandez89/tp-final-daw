import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

/** Cuerpo de `PATCH /doctors/:id/valor-consulta`. */
export class UpdateDoctorFeeDto {
  /** Nuevo valor de consulta, entero positivo en pesos argentinos. */
  @ApiProperty({
    type: 'integer',
    minimum: 1,
    maximum: 2147483647,
    description: 'Nuevo valor de la consulta en pesos argentinos.',
    example: 18000,
  })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  valor_consulta: number;
}
