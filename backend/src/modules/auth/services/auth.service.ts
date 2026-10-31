import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { LoginDto } from '../dtos/input/login.dto.js';
import { LoginResponseDto } from '../dtos/output/login-response.dto.js';
import { UserState } from '../enums/user-state.enum.js';

/**
 * Servicio de autenticación.
 *
 * Valida credenciales contra la tabla `usuarios` (sólo usuarios `ACTIVO`) y
 * emite tokens JWT con el payload `{ sub: id, role: rol }`.
 */
@Injectable()
export class AuthService {
  /**
   * Inyecta el repositorio de usuarios y el servicio JWT.
   *
   * @param usersRepository Repositorio de la entidad {@link User}.
   * @param jwtService Servicio para firmar los tokens de acceso.
   */
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Autentica a un usuario por documento y clave.
   *
   * Busca un usuario activo con ese documento y compara la clave con el hash
   * bcrypt almacenado. Para no revelar si el documento existe, el mensaje de
   * error es el mismo en ambos casos.
   *
   * @param loginDto Documento y clave.
   * @returns Token de acceso y datos básicos del usuario.
   * @throws UnauthorizedException si el usuario no existe, está dado de baja o la clave no coincide.
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { documento: loginDto.documento, estado: UserState.ACTIVO },
    });
    if (!user || !(await bcrypt.compare(loginDto.clave, user.clave))) {
      throw new UnauthorizedException('Documento o clave inválidos.');
    }

    const payload = { sub: user.id, role: user.rol };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.rol,
      },
    };
  }
}
