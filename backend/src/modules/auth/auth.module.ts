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
import { OrcidStrategy } from './strategies/orcid.strategy';
import { EmailModule } from '../email/email.module';

// Conditional ORCID provider - only register if credentials exist
const orcidProviderFactory = {
  provide: 'ORCID_STRATEGY',
  useFactory: (configService: ConfigService, authService: AuthService) => {
    const clientId = configService.get('ORCID_CLIENT_ID');
    const clientSecret = configService.get('ORCID_CLIENT_SECRET');

    // Only create ORCID strategy if real credentials are provided
    if (
      clientId &&
      clientSecret &&
      clientId !== 'your-orcid-client-id' &&
      clientSecret !== 'your-orcid-client-secret'
    ) {
      return new OrcidStrategy(configService, authService);
    }

    // Return null if no credentials - ORCID auth will not be available
    console.log(
      '[AuthModule] ORCID credentials not configured - ORCID authentication disabled',
    );
    return null;
  },
  inject: [ConfigService, AuthService],
};

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
  providers: [
    AuthService,
    AuditService,
    TwoFactorService,
    JwtStrategy,
    orcidProviderFactory,
  ],
  exports: [AuthService, AuditService, TwoFactorService],
})
export class AuthModule {}
