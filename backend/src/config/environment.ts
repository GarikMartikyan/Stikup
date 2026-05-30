export type AppEnv = 'development' | 'production' | 'test';

export function resolveAppEnv(): AppEnv {
  const raw = (
    process.env.APP_ENV ??
    process.env.NODE_ENV ??
    'development'
  ).toLowerCase();

  if (raw === 'prod') return 'production';
  if (raw === 'dev') return 'development';
  if (raw === 'production' || raw === 'test') return raw;
  return 'development';
}

export interface EnvProfile {
  appEnv: AppEnv;
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;
  swaggerEnabled: boolean;
  exposeErrorDetails: boolean;
  cookieSecureDefault: boolean;
  strictSecrets: boolean;
}

export function getEnvProfile(appEnv: AppEnv = resolveAppEnv()): EnvProfile {
  const isProd = appEnv === 'production';
  const isTest = appEnv === 'test';
  const isDev = appEnv === 'development';
  return {
    appEnv,
    isDev,
    isProd,
    isTest,
    swaggerEnabled: !isProd,
    exposeErrorDetails: !isProd,
    cookieSecureDefault: isProd,
    strictSecrets: isProd,
  };
}

const PLACEHOLDER_EXACT = new Set(['changeme', '__change_me__']);

export function isPlaceholder(v?: string): boolean {
  if (v === undefined || v.trim() === '') return true;
  const lower = v.toLowerCase();
  if (PLACEHOLDER_EXACT.has(lower)) return true;
  if (lower.includes('your_domain') || lower.includes('your_bot')) return true;
  return false;
}
