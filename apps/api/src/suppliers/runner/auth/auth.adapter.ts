/**
 * Auth adapters mutate an outgoing request (URL + headers) to add credentials.
 * Implementations are pure given a (config, baseHeaders) pair, except the
 * OAuth2 adapter which also performs an HTTP token exchange.
 */
export interface RequestPlan {
  url: string;
  headers: Record<string, string>;
}

export interface AuthAdapter {
  /** Apply credentials to a request, returning the modified plan. */
  apply(plan: RequestPlan): Promise<RequestPlan>;
}

/* ---- Credential shapes per auth type. ----------------------------------- */

export interface ApiKeyCredentials {
  /** Where to put the key. Defaults to "header". */
  in?: 'header' | 'query';
  /** Name of the header or query param. Defaults to "X-API-Key" / "api_key". */
  name?: string;
  key: string;
}

export interface BasicCredentials {
  username: string;
  password: string;
}

export interface BearerCredentials {
  token: string;
}

export interface OAuth2ClientCredentials {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  /** Optional space-separated scopes. */
  scope?: string;
  /** Optional audience parameter (Auth0 etc.). */
  audience?: string;
}

export type AnyCredentials =
  | ApiKeyCredentials
  | BasicCredentials
  | BearerCredentials
  | OAuth2ClientCredentials;
