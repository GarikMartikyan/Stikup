import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get port(): number {
    return this.int('PORT', 3131);
  }

  get telegramBotToken(): string {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
    return token;
  }

  get frontendUrl(): string | undefined {
    return this.config.get<string>('FRONTEND_URL') || undefined;
  }

  get frontendHost(): string | undefined {
    return this.config.get<string>('FRONTEND_HOST') || undefined;
  }

  get frontendPort(): number {
    return this.int('FRONTEND_PORT', 3000);
  }

  get frontendUseHttps(): boolean {
    return this.bool('FRONTEND_USE_HTTPS', false);
  }

  get publicAppUrl(): string {
    const explicit = this.config.get<string>('PUBLIC_APP_URL');
    if (explicit) return explicit.replace(/\/$/, '');
    if (this.frontendUrl) return this.frontendUrl.replace(/\/$/, '');
    const scheme = this.frontendUseHttps ? 'https' : 'http';
    const host = this.frontendHost ?? 'localhost';
    return `${scheme}://${host}:${this.frontendPort}`;
  }

  get sessionCookieName(): string {
    return this.config.get<string>('SESSION_COOKIE_NAME') || 'sid';
  }

  get sessionCookieDomain(): string | undefined {
    return this.config.get<string>('SESSION_COOKIE_DOMAIN') || undefined;
  }

  get sessionCookieSecure(): boolean {
    return this.bool('SESSION_COOKIE_SECURE', false);
  }

  get postLoginPath(): string {
    return this.config.get<string>('POST_LOGIN_PATH') || '/dashboard';
  }

  private int(key: string, fallback: number): number {
    const raw = this.config.get<string>(key);
    if (raw === undefined || raw === '') return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private bool(key: string, fallback: boolean): boolean {
    const raw = this.config.get<string>(key);
    if (raw === undefined) return fallback;
    return raw.toLowerCase() === 'true';
  }
}
