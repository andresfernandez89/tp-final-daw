import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { getJwtConfig } from './config/jwt.config.js';
import { LoginController } from './controllers/login.controller.js';
import { AuthGuard } from './guards/auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { AuthService } from './services/auth.service.js';

/**
 * Módulo de autenticación y autorización.
 *
 * Expone el endpoint de inicio de sesión y provee los guards {@link AuthGuard}
 * (valida el JWT) y {@link RolesGuard} (valida el rol) que el resto de los
 * módulos importan para proteger sus endpoints. También exporta `JwtModule`,
 * configurado con el secreto `JWT_SECRET` y una expiración de 8 horas.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),
  ],
  controllers: [LoginController],
  providers: [AuthService, AuthGuard, RolesGuard],
  exports: [AuthService, AuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
