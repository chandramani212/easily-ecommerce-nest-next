import {
  AuthAdapter,
  BasicCredentials,
  RequestPlan,
} from './auth.adapter';

export class BasicAdapter implements AuthAdapter {
  constructor(private readonly creds: BasicCredentials) {}

  async apply(plan: RequestPlan): Promise<RequestPlan> {
    const token = Buffer.from(
      `${this.creds.username}:${this.creds.password}`,
      'utf8',
    ).toString('base64');
    return {
      ...plan,
      headers: { ...plan.headers, Authorization: `Basic ${token}` },
    };
  }
}
