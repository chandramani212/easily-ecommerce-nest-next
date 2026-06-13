import {
  AuthAdapter,
  OAuth2ClientCredentials,
  RequestPlan,
} from './auth.adapter';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

const cache = new Map<string, CachedToken>();
const SAFETY_WINDOW_MS = 30_000;

function cacheKey(c: OAuth2ClientCredentials): string {
  return [
    c.tokenUrl,
    c.clientId,
    c.scope ?? '',
    c.audience ?? '',
  ].join('|');
}

/**
 * OAuth2 Client Credentials grant. Tokens are cached in-process keyed by
 * (tokenUrl, clientId, scope, audience) and reused until 30 s before expiry.
 */
export class OAuth2ClientCredentialsAdapter implements AuthAdapter {
  constructor(private readonly creds: OAuth2ClientCredentials) {}

  async apply(plan: RequestPlan): Promise<RequestPlan> {
    const token = await this.getToken();
    return {
      ...plan,
      headers: { ...plan.headers, Authorization: `Bearer ${token}` },
    };
  }

  private async getToken(): Promise<string> {
    const key = cacheKey(this.creds);
    const cached = cache.get(key);
    if (cached && cached.expiresAt - Date.now() > SAFETY_WINDOW_MS) {
      return cached.accessToken;
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.creds.clientId,
      client_secret: this.creds.clientSecret,
    });
    if (this.creds.scope) body.set('scope', this.creds.scope);
    if (this.creds.audience) body.set('audience', this.creds.audience);

    const res = await fetch(this.creds.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OAuth2 token exchange failed (${res.status}): ${text}`);
    }
    const json = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!json.access_token) {
      throw new Error('OAuth2 token response missing access_token');
    }
    const expiresInMs = (json.expires_in ?? 3600) * 1000;
    cache.set(key, {
      accessToken: json.access_token,
      expiresAt: Date.now() + expiresInMs,
    });
    return json.access_token;
  }
}

export function clearOAuth2TokenCache(): void {
  cache.clear();
}
