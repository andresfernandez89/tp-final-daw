import { ApiProperty } from '@nestjs/swagger';
import { LoginUserDto } from './login-user.dto.js';

export class LoginResponseDto {
  @ApiProperty({ type: String })
  accessToken: string;

  @ApiProperty({ type: LoginUserDto })
  user: LoginUserDto;
}
