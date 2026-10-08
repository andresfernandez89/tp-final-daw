import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class DoctorListItemDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'Ana' })
  @IsString()
  nombres: string;

  @ApiProperty({ example: 'Diaz' })
  @IsString()
  apellidos: string;

  @ApiProperty({ example: 123 })
  @IsInt()
  matricula: number;

  @ApiProperty({ example: 15000 })
  @IsInt()
  valor_consulta: number;
}
