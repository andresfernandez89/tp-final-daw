import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class PatientDto {
  @ApiProperty({
    description: 'Identificador del paciente en la tabla usuarios.',
    type: 'integer',
    example: 7,
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Documento del paciente.',
    example: '30000001',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({
    description: 'Nombres del paciente.',
    example: 'Uno',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Apellidos del paciente.',
    example: 'Paciente',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}
