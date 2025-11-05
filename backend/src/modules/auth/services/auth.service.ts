import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../../common/prisma.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/auth.dto';
import { AuditService } from '../services/audit.service';
import { EmailService } from '../../email/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private emailService: EmailService,
  ) {}

  async register(
    registerDto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const { email, password, name, role = 'RESEARCHER' } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_ROUNDS', '12'),
      10,
    );
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as any,
        passwordChangedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Log registration
    await this.auditService.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      resource: 'User',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, password, rememberMe = false } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(
        'Account is temporarily locked due to too many failed login attempts',
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, rememberMe);

    // Log successful login
    await this.auditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      ...tokens,
    };
  }

  async refreshToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Find session
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!session.user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(session.userId);

    // Delete old session
    await this.prisma.session.delete({
      where: { id: session.id },
    });

    // Log token refresh
    await this.auditService.log({
      userId: session.userId,
      action: 'TOKEN_REFRESHED',
      resource: 'Session',
      resourceId: session.id,
      ipAddress,
      userAgent,
    });

    return tokens;
  }

  async logout(refreshToken: string, userId: string) {
    // Delete session
    await this.prisma.session.deleteMany({
      where: {
        refreshToken,
        userId,
      },
    });

    // Log logout
    await this.auditService.log({
      userId,
      action: 'USER_LOGOUT',
      resource: 'Session',
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * Find or create user from ORCID OAuth
   * Day 27: ORCID Authentication Implementation
   */
  async findOrCreateOrcidUser(orcidData: {
    orcid: string;
    name: string;
    email?: string;
    institution?: string;
    accessToken: string;
    refreshToken: string;
  }) {
    // Check if user exists with this ORCID
    let user = await this.prisma.user.findFirst({
      where: { orcidId: orcidData.orcid },
    });

    if (user) {
      // Update ORCID tokens for existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          orcidAccessToken: orcidData.accessToken,
          orcidRefreshToken: orcidData.refreshToken,
          lastLogin: new Date(),
        },
      });

      // Log ORCID login
      await this.auditService.log({
        userId: user.id,
        action: 'ORCID_LOGIN',
        resource: 'User',
        resourceId: user.id,
      });

      return user;
    }

    // Create new user from ORCID
    const email = orcidData.email || `${orcidData.orcid}@orcid.local`;

    // Generate random password for OAuth users (they won't use it)
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_ROUNDS', '12'),
      10,
    );
    const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);

    user = await this.prisma.user.create({
      data: {
        email,
        name: orcidData.name,
        password: hashedPassword,
        orcidId: orcidData.orcid,
        orcidAccessToken: orcidData.accessToken,
        orcidRefreshToken: orcidData.refreshToken,
        institution: orcidData.institution,
        role: 'RESEARCHER',
        isActive: true,
        lastLogin: new Date(),
      },
    });

    // Log ORCID registration
    await this.auditService.log({
      userId: user.id,
      action: 'ORCID_REGISTERED',
      resource: 'User',
      resourceId: user.id,
    });

    return user;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        passwordChangedAt: new Date(),
      },
    });

    // Invalidate all sessions except current one
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    // Log password change
    await this.auditService.log({
      userId,
      action: 'PASSWORD_CHANGED',
      resource: 'User',
      resourceId: userId,
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Generate JWT tokens for OAuth users (public method)
   * Day 27: ORCID OAuth
   */
  async generateOAuthTokens(userId: string) {
    return this.generateTokens(userId, false);
  }

  private async generateTokens(userId: string, rememberMe = false) {
    // Add a unique identifier to prevent duplicate tokens
    const payload = {
      sub: userId,
      jti: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const refreshExpiresIn = rememberMe
      ? '30d'
      : this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn,
      }),
      this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: refreshExpiresIn,
        },
      ),
    ]);

    // Clean up expired sessions for this user
    await this.prisma.session.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async handleFailedLogin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const failedAttempts = user.failedLoginAttempts + 1;
    const maxAttempts = 5;
    const lockDuration = 15 * 60 * 1000; // 15 minutes

    let updateData: any = {
      failedLoginAttempts: failedAttempts,
    };

    if (failedAttempts >= maxAttempts) {
      updateData.lockedUntil = new Date(Date.now() + lockDuration);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    ipAddress?: string,
  ) {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success message to prevent email enumeration
    if (!user) {
      return {
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    // Delete any existing password reset tokens for this user
    await this.prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save token to database (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    // Send reset email
    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error: any) {
      console.error('Failed to send password reset email:', error);
      // Don't throw error to prevent information disclosure
    }

    // Log password reset request
    await this.auditService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      resource: 'User',
      resourceId: user.id,
      ipAddress,
    });

    return {
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, ipAddress?: string) {
    const { token, newPassword } = resetPasswordDto;

    // Hash the token to match what's stored in database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const passwordReset = await this.prisma.passwordReset.findFirst({
      where: {
        token: hashedToken,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate password complexity
    if (!this.validatePasswordComplexity(newPassword)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character',
      );
    }

    // Hash new password
    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_ROUNDS', '12'),
      10,
    );
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await this.prisma.user.update({
      where: { id: passwordReset.userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    // Delete used reset token
    await this.prisma.passwordReset.delete({
      where: { id: passwordReset.id },
    });

    // Invalidate all user sessions for security
    await this.prisma.session.deleteMany({
      where: { userId: passwordReset.userId },
    });

    // Log password reset
    await this.auditService.log({
      userId: passwordReset.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      resource: 'User',
      resourceId: passwordReset.userId,
      ipAddress,
    });

    return { message: 'Password has been reset successfully' };
  }

  async verifyEmail(token: string, ipAddress?: string) {
    // Hash the token to match what's stored in database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid verification token
    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        token: hashedToken,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Mark email as verified
    await this.prisma.user.update({
      where: { id: verification.userId },
      data: {
        emailVerified: true,
      },
    });

    // Delete used verification token
    await this.prisma.emailVerification.delete({
      where: { id: verification.id },
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(
      verification.user.email,
      verification.user.name || 'User',
    );

    // Log email verification
    await this.auditService.log({
      userId: verification.userId,
      action: 'EMAIL_VERIFIED',
      resource: 'User',
      resourceId: verification.userId,
      ipAddress,
    });

    return { message: 'Email verified successfully' };
  }

  private validatePasswordComplexity(password: string): boolean {
    // At least 8 characters
    if (password.length < 8) return false;

    // Contains uppercase letter
    if (!/[A-Z]/.test(password)) return false;

    // Contains lowercase letter
    if (!/[a-z]/.test(password)) return false;

    // Contains number
    if (!/[0-9]/.test(password)) return false;

    // Contains special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

    return true;
  }
}
