import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '12403511' })
  @IsString()
  @IsNotEmpty()
  documento: string;

  @ApiProperty({ format: 'password' })
  @IsString()
  @IsNotEmpty()
  clave: string;
}
