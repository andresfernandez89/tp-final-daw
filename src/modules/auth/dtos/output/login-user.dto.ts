import { IsEmail, IsEnum, IsInt } from 'class-validator';
import { UserRole } from '../../enums/user-role.enum.js';

export class LoginUserDto {
  @IsInt()
  id: number;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;
}
