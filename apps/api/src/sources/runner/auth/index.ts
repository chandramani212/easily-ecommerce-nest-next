import { SourceAuthType } from '@prisma/client';

import { ApiKeyAdapter } from './api-key.adapter';
import { AsiMemberAuthAdapter } from './asi-member.adapter';
import {
  ApiKeyCredentials,
  AsiMemberAuthCredentials,
  AuthAdapter,
  BasicCredentials,
  BearerCredentials,
  OAuth2ClientCredentials,
  RequestPlan,
} from './auth.adapter';
import { BasicAdapter } from './basic.adapter';
import { BearerAdapter } from './bearer.adapter';
import { OAuth2ClientCredentialsAdapter } from './oauth2-cc.adapter';

class NoopAdapter implements AuthAdapter {
  async apply(plan: RequestPlan): Promise<RequestPlan> {
    return plan;
  }
}

/**
 * Build an `AuthAdapter` for a source based on its persisted authType and
 * already-decrypted credentials object.
 */
export function buildAuthAdapter(
  authType: SourceAuthType,
  credentials: unknown,
): AuthAdapter {
  switch (authType) {
    case 'NONE':
      return new NoopAdapter();
    case 'API_KEY':
      return new ApiKeyAdapter(credentials as ApiKeyCredentials);
    case 'BASIC':
      return new BasicAdapter(credentials as BasicCredentials);
    case 'BEARER':
      return new BearerAdapter(credentials as BearerCredentials);
    case 'OAUTH2_CLIENT_CREDENTIALS':
      return new OAuth2ClientCredentialsAdapter(
        credentials as OAuth2ClientCredentials,
      );
    case 'ASI_MEMBER_AUTH':
      return new AsiMemberAuthAdapter(credentials as AsiMemberAuthCredentials);
    default: {
      const _exhaustive: never = authType;
      void _exhaustive;
      return new NoopAdapter();
    }
  }
}

export type {
  ApiKeyCredentials,
  AsiMemberAuthCredentials,
  AuthAdapter,
  BasicCredentials,
  BearerCredentials,
  OAuth2ClientCredentials,
  RequestPlan,
} from './auth.adapter';
