import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../../common/prisma.service';
import { AuditService } from './audit.service';

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    _configService: ConfigService,
    private auditService: AuditService,
  ) {}

  /**
   * Generate a new 2FA secret for a user
   */
  async generateSecret(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorSecret: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `VQMethod (${user.email})`,
      issuer: 'VQMethod',
      length: 32,
    });

    // Store the secret temporarily (not enabled yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
      },
    });

    // Generate QR code
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: user.email,
      issuer: 'VQMethod',
      encoding: 'base32',
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    await this.auditService.log({
      userId,
      action: '2FA_SECRET_GENERATED',
      resource: 'User',
      resourceId: userId,
    });

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      manualSetupKey: secret.base32,
    };
  }

  /**
   * Enable 2FA for a user after verifying the token
   */
  async enable2FA(userId: string, token: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorSecret) {
      throw new UnauthorizedException('2FA secret not generated');
    }

    if (user.twoFactorEnabled) {
      throw new UnauthorizedException('2FA already enabled');
    }

    // Verify the token
    const isValid = this.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      await this.auditService.log({
        userId,
        action: '2FA_ENABLE_FAILED',
        resource: 'User',
        resourceId: userId,
        details: { reason: 'Invalid token' },
        ipAddress,
      });
      throw new UnauthorizedException('Invalid 2FA token');
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
      },
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Store hashed backup codes
    await this.storeBackupCodes(userId, backupCodes);

    await this.auditService.log({
      userId,
      action: '2FA_ENABLED',
      resource: 'User',
      resourceId: userId,
      ipAddress,
    });

    return {
      success: true,
      backupCodes,
    };
  }

  /**
   * Disable 2FA for a user
   */
  async disable2FA(userId: string, _password: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new UnauthorizedException('2FA not enabled');
    }

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    // Remove backup codes
    await this.prisma.twoFactorBackup.deleteMany({
      where: { userId },
    });

    await this.auditService.log({
      userId,
      action: '2FA_DISABLED',
      resource: 'User',
      resourceId: userId,
      ipAddress,
    });

    return { success: true };
  }

  /**
   * Verify a TOTP token
   */
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after for clock skew
    });
  }

  /**
   * Verify a 2FA token for login
   */
  async verify2FAToken(userId: string, token: string, ipAddress?: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    const isValid = this.verifyToken(user.twoFactorSecret, token);

    if (isValid) {
      await this.auditService.log({
        userId,
        action: '2FA_VERIFIED',
        resource: 'User',
        resourceId: userId,
        ipAddress,
      });
    } else {
      await this.auditService.log({
        userId,
        action: '2FA_VERIFICATION_FAILED',
        resource: 'User',
        resourceId: userId,
        ipAddress,
      });
    }

    return isValid;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = speakeasy.generateSecret({ length: 10 }).base32
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 8);
      codes.push(code);
    }
    return codes;
  }

  /**
   * Store backup codes (hashed)
   */
  private async storeBackupCodes(userId: string, codes: string[]) {
    const bcrypt = require('bcryptjs');
    
    // Delete existing backup codes
    await this.prisma.twoFactorBackup.deleteMany({
      where: { userId },
    });

    // Store new codes (hashed)
    const hashedCodes = await Promise.all(
      codes.map(async (code) => ({
        userId,
        code: await bcrypt.hash(code, 10),
        used: false,
      }))
    );

    await this.prisma.twoFactorBackup.createMany({
      data: hashedCodes,
    });
  }

  /**
   * Verify and use a backup code
   */
  async verifyBackupCode(userId: string, code: string, ipAddress?: string): Promise<boolean> {
    const bcrypt = require('bcryptjs');
    
    const backupCodes = await this.prisma.twoFactorBackup.findMany({
      where: { 
        userId,
        used: false,
      },
    });

    for (const backupCode of backupCodes) {
      const isValid = await bcrypt.compare(code, backupCode.code);
      if (isValid) {
        // Mark code as used
        await this.prisma.twoFactorBackup.update({
          where: { id: backupCode.id },
          data: { used: true },
        });

        await this.auditService.log({
          userId,
          action: '2FA_BACKUP_CODE_USED',
          resource: 'User',
          resourceId: userId,
          ipAddress,
        });

        return true;
      }
    }

    await this.auditService.log({
      userId,
      action: '2FA_BACKUP_CODE_FAILED',
      resource: 'User',
      resourceId: userId,
      ipAddress,
    });

    return false;
  }
}