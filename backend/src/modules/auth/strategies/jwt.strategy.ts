import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly isDevelopment: boolean;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret =
      configService.get<string>('JWT_SECRET') || 'default-secret';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });

    // Initialize after super() call
    this.isDevelopment = process.env.NODE_ENV !== 'production';

    if (this.isDevelopment) {
      console.log(
        '🔐 [JwtStrategy] Initializing with JWT_SECRET:',
        jwtSecret.substring(0, 10) + '...',
      );
      console.log('🔐 [JwtStrategy] Strategy initialized successfully');
    }
  }

  async validate(payload: any) {
    if (this.isDevelopment) {
      console.log('🔐 [JwtStrategy] validate() called');
      console.log('🔐 [JwtStrategy] Payload:', payload);
      console.log('🔐 [JwtStrategy] User ID (sub):', payload.sub);
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          twoFactorEnabled: true,
          tenantId: true,
        },
      });

      if (this.isDevelopment) {
        console.log('🔐 [JwtStrategy] User found:', user ? 'YES' : 'NO');
        if (user) {
          console.log('🔐 [JwtStrategy] User email:', user.email);
          console.log('🔐 [JwtStrategy] User active:', user.isActive);
        }
      }

      if (!user || !user.isActive) {
        if (this.isDevelopment) {
          console.error(
            '🔐 [JwtStrategy] VALIDATION FAILED: User not found or inactive',
          );
        }
        throw new UnauthorizedException('User not found or inactive');
      }

      if (this.isDevelopment) {
        console.log(
          '🔐 [JwtStrategy] VALIDATION SUCCESS - Returning user object',
        );
      }

      return {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        tenantId: user.tenantId,
      };
    } catch (error) {
      // Only log full error details in development
      if (this.isDevelopment) {
        console.error('🔐 [JwtStrategy] ERROR during validation:', error);
      }
      throw error;
    }
  }
}
