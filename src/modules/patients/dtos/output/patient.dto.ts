import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class PatientDto {
  @IsInt()
  id: number;

  @IsString()
  @IsNotEmpty()
  document: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}
