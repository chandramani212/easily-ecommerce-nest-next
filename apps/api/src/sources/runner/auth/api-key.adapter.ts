import {
  ApiKeyCredentials,
  AuthAdapter,
  RequestPlan,
} from './auth.adapter';

export class ApiKeyAdapter implements AuthAdapter {
  constructor(private readonly creds: ApiKeyCredentials) {}

  async apply(plan: RequestPlan): Promise<RequestPlan> {
    const target = this.creds.in ?? 'header';
    if (target === 'query') {
      const name = this.creds.name ?? 'api_key';
      const u = new URL(plan.url);
      u.searchParams.set(name, this.creds.key);
      return { ...plan, url: u.toString() };
    }
    const name = this.creds.name ?? 'X-API-Key';
    return {
      ...plan,
      headers: { ...plan.headers, [name]: this.creds.key },
    };
  }
}
