import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from '../dtos/input/login.dto.js';
import { LoginResponseDto } from '../dtos/output/login-response.dto.js';
import { AuthService } from '../services/auth.service.js';

@Controller('auth')
export class LoginController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }
}
