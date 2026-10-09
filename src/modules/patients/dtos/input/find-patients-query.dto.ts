import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class FindPatientsQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'El documento no puede estar vacío.' })
  document?: string;
}
