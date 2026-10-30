import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../../common/dtos/error-response.dto.js';
import { LoginDto } from '../dtos/input/login.dto.js';
import { LoginResponseDto } from '../dtos/output/login-response.dto.js';
import { AuthService } from '../services/auth.service.js';

/**
 * Controlador de inicio de sesión (`/api/v1/auth`).
 *
 * Es el único controlador público de la API: no requiere token.
 */
@ApiTags('Autenticación')
@Controller('auth')
export class LoginController {
  constructor(private readonly authService: AuthService) {}

  /**
   * `POST /auth/login` — Autentica a un usuario activo por documento y clave.
   *
   * @param loginDto Credenciales del usuario.
   * @returns Token de acceso JWT y datos básicos del usuario autenticado.
   */
  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica a un usuario activo y devuelve un token de acceso y sus datos. ' +
      'El token debe enviarse en la cabecera `Authorization: Bearer <token>` ' +
      'en el resto de las operaciones. Expira a las 8 horas.',
  })
  @ApiCreatedResponse({
    type: LoginResponseDto,
    description: 'Credenciales válidas: token de acceso y datos del usuario.',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Cuerpo de la solicitud no válido.',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'El número de documento o la contraseña son incorrectos.',
  })
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }
}
