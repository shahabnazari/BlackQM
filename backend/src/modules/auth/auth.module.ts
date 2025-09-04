import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { TwoFactorController } from './controllers/two-factor.controller';
import { AuthService } from './services/auth.service';
import { AuditService } from './services/audit.service';
import { TwoFactorService } from './services/two-factor.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '../../common/prisma.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, TwoFactorController],
  providers: [AuthService, AuditService, TwoFactorService, JwtStrategy, PrismaService],
  exports: [AuthService, AuditService, TwoFactorService],
})
export class AuthModule {}
