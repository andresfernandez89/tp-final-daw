import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class DoctorListItemDto {
  @ApiProperty()
  @IsInt()
  id: number;

  @ApiProperty()
  @IsString()
  nombres: string;

  @ApiProperty()
  @IsString()
  apellidos: string;

  @ApiProperty()
  @IsInt()
  matricula: number;

  @ApiProperty()
  @IsInt()
  valor_consulta: number;
}
