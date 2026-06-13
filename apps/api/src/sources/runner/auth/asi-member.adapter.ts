import {
  AsiMemberAuthCredentials,
  AuthAdapter,
  RequestPlan,
} from './auth.adapter';

/**
 * ASI Central's bespoke auth scheme:
 *   Authorization: AsiMemberAuth client_id=<id>&client_secret=<secret>
 * The value is a static signed credential pair — no token exchange.
 */
export class AsiMemberAuthAdapter implements AuthAdapter {
  constructor(private readonly creds: AsiMemberAuthCredentials) {}

  async apply(plan: RequestPlan): Promise<RequestPlan> {
    if (!this.creds.clientId || !this.creds.clientSecret) {
      throw new Error(
        'ASI member auth requires both clientId and clientSecret.',
      );
    }
    const scheme = this.creds.scheme ?? 'AsiMemberAuth';
    const value = `${scheme} client_id=${this.creds.clientId}&client_secret=${this.creds.clientSecret}`;
    return {
      ...plan,
      headers: { ...plan.headers, Authorization: value },
    };
  }
}
