import { LoginUserDto } from './login-user.dto.js';

export class LoginResponseDto {
  accessToken: string;

  user: LoginUserDto;
}
