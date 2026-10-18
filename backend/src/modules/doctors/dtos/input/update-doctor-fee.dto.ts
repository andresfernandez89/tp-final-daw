import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateDoctorFeeDto {
  @ApiProperty({
    type: 'integer',
    minimum: 1,
    maximum: 2147483647,
    description: 'Nuevo valor de la consulta en pesos argentinos.',
  })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  valor_consulta: number;
}
