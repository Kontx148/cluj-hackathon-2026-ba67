import { GATEWAY_URLS } from './client';

/**
 * The gateway reports validator URLs using their Docker-internal hostnames
 * (e.g. `http://validator-1:4101`). Those aren't resolvable from a browser,
 * so for *display* purposes we rewrite them to use the gateway's public host.
 *
 * This is presentation-only — the dashboard never POSTs directly to a
 * validator. All traffic still goes through the gateway via `apiFetch`.
 *
 * Override the inferred host by setting `VITE_VALIDATOR_PUBLIC_HOST` in `.env`.
 */
function inferPublicHost(): string | null {
  const override = import.meta.env.VITE_VALIDATOR_PUBLIC_HOST as
    | string
    | undefined;
  if (override) return override;
  try {
    return new URL(GATEWAY_URLS.primary).hostname;
  } catch {
    return null;
  }
}

const PUBLIC_HOST = inferPublicHost();

export function toPublicValidatorUrl(dockerUrl: string | undefined): string {
  if (!dockerUrl) return '';
  if (!PUBLIC_HOST) return dockerUrl;
  try {
    const u = new URL(dockerUrl);
    // Only rewrite obvious internal hostnames so we don't clobber URLs that
    // are already public.
    if (/^validator-\d+$/.test(u.hostname)) {
      u.hostname = PUBLIC_HOST;
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return dockerUrl;
  }
}

export function shortValidatorId(value: string | undefined): string {
  if (!value) return '';
  const match = value.match(/validator-\d+/);
  return match ? match[0] : value;
}
