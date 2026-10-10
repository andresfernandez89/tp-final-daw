import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from '../dtos/input/login.dto.js';
import { LoginResponseDto } from '../dtos/output/login-response.dto.js';
import { AuthService } from '../services/auth.service.js';

@ApiTags('Autenticación')
@Controller('auth')
export class LoginController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica a un usuario activo y devuelve un token de acceso y sus datos.',
  })
  @ApiCreatedResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({ description: 'Cuerpo de la solicitud no válido.' })
  @ApiUnauthorizedResponse({
    description: 'El número de documento o la contraseña son incorrectos.',
  })
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }
}
