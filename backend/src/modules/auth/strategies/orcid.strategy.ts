/**
 * ORCID OAuth Strategy
 * Day 27: Real SSO Authentication Implementation
 *
 * Implements OAuth 2.0 authentication with ORCID
 * for institutional/academic user authentication
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-orcid';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';

@Injectable()
export class OrcidStrategy extends PassportStrategy(Strategy, 'orcid') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('ORCID_CLIENT_ID'),
      clientSecret: configService.get('ORCID_CLIENT_SECRET'),
      callbackURL:
        configService.get('ORCID_CALLBACK_URL') ||
        'http://localhost:4000/api/auth/orcid/callback',
      scope: '/authenticate',
      sandbox: configService.get('NODE_ENV') === 'development', // Use sandbox in dev
    } as any);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    params: any,
    profile: any,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    try {
      // Extract ORCID data
      const orcidData = {
        orcid: profile.id || profile.orcid,
        name:
          profile.displayName ||
          (profile.name
            ? `${profile.name.givenName} ${profile.name.familyName}`
            : 'ORCID User'),
        email: profile.emails?.[0]?.value,
        institution:
          profile._json?.['affiliation']?.[0]?.['organization']?.['name'],
        accessToken,
        refreshToken,
      };

      // Find or create user with ORCID authentication
      const user = await this.authService.findOrCreateOrcidUser(orcidData);

      if (!user) {
        throw new UnauthorizedException('Failed to authenticate with ORCID');
      }

      return done(null, user);
    } catch (error: any) {
      return done(error, false);
    }
  }
}
