import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    if (this.isDevelopment) {
      console.log('🔐 [JwtAuthGuard] canActivate() called');
      const request = context.switchToHttp().getRequest();
      // Only log first 50 chars of token for security
      const authHeader = request.headers.authorization;
      const displayHeader =
        authHeader?.length > 50
          ? `${authHeader.substring(0, 50)}...`
          : authHeader;
      console.log('🔐 [JwtAuthGuard] Authorization header:', displayHeader);
    }

    return super.canActivate(context);
  }

  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ) {
    if (this.isDevelopment) {
      console.log('🔐 [JwtAuthGuard] handleRequest() called');
      console.log('🔐 [JwtAuthGuard] Error:', err);
      console.log('🔐 [JwtAuthGuard] User:', user ? 'Present' : 'Missing');
      console.log('🔐 [JwtAuthGuard] Info:', info);

      if (err || !user) {
        console.error('🔐 [JwtAuthGuard] Authentication failed!');
        console.error(
          '🔐 [JwtAuthGuard] Reason:',
          info?.message || err?.message || 'Unknown',
        );
      }
    }

    return super.handleRequest(err, user, info, context, status);
  }
}
