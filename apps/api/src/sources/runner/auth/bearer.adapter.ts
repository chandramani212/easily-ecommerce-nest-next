import {
  AuthAdapter,
  BearerCredentials,
  RequestPlan,
} from './auth.adapter';

export class BearerAdapter implements AuthAdapter {
  constructor(private readonly creds: BearerCredentials) {}

  async apply(plan: RequestPlan): Promise<RequestPlan> {
    return {
      ...plan,
      headers: { ...plan.headers, Authorization: `Bearer ${this.creds.token}` },
    };
  }
}
