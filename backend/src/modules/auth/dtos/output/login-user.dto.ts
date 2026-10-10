import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsInt } from 'class-validator';
import { UserRole } from '../../enums/user-role.enum.js';

export class LoginUserDto {
  @ApiProperty({ type: Number })
  @IsInt()
  id: number;

  @ApiProperty({ type: String, format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}
