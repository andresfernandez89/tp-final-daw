import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { LoginDto } from '../dtos/input/login.dto.js';
import { LoginResponseDto } from '../dtos/output/login-response.dto.js';
import { UserState } from '../enums/user-state.enum.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

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
