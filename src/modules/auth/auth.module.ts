import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { getJwtConfig } from './config/jwt.config.js';
import { LoginController } from './controllers/login.controller.js';
import { AuthGuard } from './guards/auth.guard.js';
import { AuthService } from './services/auth.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),
  ],
  controllers: [LoginController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
