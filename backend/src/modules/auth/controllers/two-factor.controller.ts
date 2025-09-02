import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TwoFactorService } from '../services/two-factor.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
// import { RateLimitGuard } from '../../rate-limiting/guards/rate-limit.guard';
// import { RateLimitingService } from '../../rate-limiting/services/rate-limiting.service';

class Enable2FADto {
  token!: string;
}

class Disable2FADto {
  password!: string;
}

class Verify2FADto {
  token!: string;
}

@ApiTags('Two-Factor Authentication')
@Controller('auth/2fa')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  @ApiResponse({ status: 200, description: '2FA secret generated successfully' })
  async generateSecret(@Req() req: any) {
    return this.twoFactorService.generateSecret(req.user.id);
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Enable 2FA for the user' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async enable2FA(
    @Body() dto: Enable2FADto,
    @Req() req: any,
    @Ip() ipAddress: string,
  ) {
    return this.twoFactorService.enable2FA(req.user.id, dto.token, ipAddress);
  }

  @Delete('disable')
  // @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Disable 2FA for the user' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async disable2FA(
    @Body() dto: Disable2FADto,
    @Req() req: any,
    @Ip() ipAddress: string,
  ) {
    return this.twoFactorService.disable2FA(req.user.id, dto.password, ipAddress);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Verify 2FA token' })
  @ApiResponse({ status: 200, description: 'Token verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async verify2FA(
    @Body() dto: Verify2FADto,
    @Req() req: any,
    @Ip() ipAddress: string,
  ) {
    const isValid = await this.twoFactorService.verify2FAToken(
      req.user.id,
      dto.token,
      ipAddress,
    );
    
    if (!isValid) {
      return {
        success: false,
        message: 'Invalid 2FA token',
      };
    }
    
    return {
      success: true,
      message: '2FA token verified successfully',
    };
  }
}