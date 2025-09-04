import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    return super.canActivate(context);
  }

  protected getTracker(req: Record<string, any>): Promise<string> {
    // Track by user ID if authenticated, otherwise by IP
    if (req.user?.id) {
      return Promise.resolve(`user-${req.user.id}`);
    }
    return Promise.resolve(req.ip);
  }

  protected generateKey(
    context: ExecutionContext,
    tracker: string,
    suffix: string,
  ): string {
    const req = context.switchToHttp().getRequest();
    // Create different rate limit buckets for different endpoints
    const route = `${req.method}-${req.route?.path || req.path}`;
    return `${route}-${tracker}-${suffix}`;
  }
}