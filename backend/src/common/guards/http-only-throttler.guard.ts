import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Wraps ThrottlerGuard so it is a no-op for non-HTTP execution contexts
 * (e.g. Telegraf RPC). Without this, the stock guard crashes on every bot
 * update because Telegraf's context does not expose res.header().
 */
@Injectable()
export class HttpOnlyThrottlerGuard extends ThrottlerGuard {
  override canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return Promise.resolve(true);
    }
    return super.canActivate(context);
  }
}
