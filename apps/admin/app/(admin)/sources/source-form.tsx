"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { clientApi, DemoReadOnlyError } from "../../../lib/client-api";
import type {
  Source,
  SourceAuthType,
  SourceKind,
} from "../../../lib/types";

const AUTH_TYPES: { value: SourceAuthType; label: string }[] = [
  { value: "NONE", label: "None" },
  { value: "API_KEY", label: "API Key" },
  { value: "BASIC", label: "Basic Auth" },
  { value: "BEARER", label: "Bearer Token" },
  { value: "OAUTH2_CLIENT_CREDENTIALS", label: "OAuth2 Client Credentials" },
  { value: "ASI_MEMBER_AUTH", label: "ASI Member Auth" },
];

interface FormState {
  name: string;
  kind: SourceKind;
  baseUrl: string;
  authType: SourceAuthType;
  defaultMarkupPct: string;
  notes: string;
  active: boolean;
}

interface AuthState {
  apiKey: string;
  apiKeyName: string;
  apiKeyIn: "header" | "query";
  basicUser: string;
  basicPass: string;
  bearerToken: string;
  oauthTokenUrl: string;
  oauthClientId: string;
  oauthClientSecret: string;
  oauthScope: string;
  oauthAudience: string;
  asiClientId: string;
  asiClientSecret: string;
}

const EMPTY_AUTH: AuthState = {
  apiKey: "",
  apiKeyName: "X-API-Key",
  apiKeyIn: "header",
  basicUser: "",
  basicPass: "",
  bearerToken: "",
  oauthTokenUrl: "",
  oauthClientId: "",
  oauthClientSecret: "",
  oauthScope: "",
  oauthAudience: "",
  asiClientId: "",
  asiClientSecret: "",
};

interface ManualSupplier {
  name: string;
  phone?: string | null;
  altPhone?: string | null;
  tollFree?: string | null;
  website?: string | null;
}

interface SupplierFormState {
  name: string;
  phone: string;
  altPhone: string;
  tollFree: string;
  website: string;
}

export function SourceForm({
  source,
  manualSupplier,
}: {
  source?: Source;
  manualSupplier?: ManualSupplier | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: source?.name ?? "",
    kind: source?.kind ?? "REST",
    baseUrl: source?.baseUrl ?? "",
    authType: source?.authType ?? "NONE",
    defaultMarkupPct: String(source?.defaultMarkupPct ?? 0),
    notes: source?.notes ?? "",
    active: source?.active ?? true,
  });
  const [supplier, setSupplier] = useState<SupplierFormState>({
    name: manualSupplier?.name ?? "",
    phone: manualSupplier?.phone ?? "",
    altPhone: manualSupplier?.altPhone ?? "",
    tollFree: manualSupplier?.tollFree ?? "",
    website: manualSupplier?.website ?? "",
  });
  const [auth, setAuth] = useState<AuthState>(EMPTY_AUTH);
  /** When editing, leave secret blank to keep existing creds. */
  const [replaceSecret, setReplaceSecret] = useState(!source);
  const [submitting, setSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<
    | { ok: true; elapsedMs: number; bytes: number; contentType: string | null }
    | { ok: false; elapsedMs: number; error: string }
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!source;

  function buildCredentials(): Record<string, unknown> | null {
    switch (form.authType) {
      case "API_KEY":
        return {
          key: auth.apiKey,
          name: auth.apiKeyName,
          in: auth.apiKeyIn,
        };
      case "BASIC":
        return { username: auth.basicUser, password: auth.basicPass };
      case "BEARER":
        return { token: auth.bearerToken };
      case "OAUTH2_CLIENT_CREDENTIALS":
        return {
          tokenUrl: auth.oauthTokenUrl,
          clientId: auth.oauthClientId,
          clientSecret: auth.oauthClientSecret,
          scope: auth.oauthScope || undefined,
          audience: auth.oauthAudience || undefined,
        };
      case "ASI_MEMBER_AUTH":
        return {
          clientId: auth.asiClientId,
          clientSecret: auth.asiClientSecret,
        };
      case "NONE":
      default:
        return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        kind: form.kind,
        baseUrl: form.baseUrl || undefined,
        authType: form.authType,
        defaultMarkupPct: Number(form.defaultMarkupPct) || 0,
        notes: form.notes,
        active: form.active,
      };
      if (!isEdit || replaceSecret) {
        payload.authCredentials = buildCredentials();
      }
      const url = isEdit ? `/sources/${source.id}` : "/sources";
      const result = await clientApi<Source>(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });

      // Upsert the manual supplier (the real company behind a direct source).
      // Only when a name is given; runs after save so we have the source id.
      if (supplier.name.trim()) {
        await clientApi(`/sources/${result.id}/supplier`, {
          method: "PUT",
          body: JSON.stringify({
            name: supplier.name.trim(),
            phone: supplier.phone || undefined,
            altPhone: supplier.altPhone || undefined,
            tollFree: supplier.tollFree || undefined,
            website: supplier.website || undefined,
          }),
        });
      }

      router.push(`/sources/${result.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof DemoReadOnlyError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Save failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTestConnection() {
    if (!isEdit) {
      setError("Save the source first, then test the connection.");
      return;
    }
    setTestResult(null);
    try {
      const r = await clientApi<typeof testResult>(
        `/sources/${source.id}/test-connection`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );
      setTestResult(r);
    } catch (err) {
      setTestResult({
        ok: false,
        elapsedMs: 0,
        error:
          err instanceof DemoReadOnlyError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Test failed",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Section title="Basic Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name *">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Source Type *">
            <select
              value={form.kind}
              onChange={(e) =>
                setForm({ ...form, kind: e.target.value as SourceKind })
              }
              className={inputCls}
            >
              <option value="REST">REST API</option>
              <option value="FILE_FEED">File feed (upload per run)</option>
              <option value="ASI_CENTRAL">ASI Central (paginated + detail)</option>
            </select>
          </Field>
          <Field label="Base URL">
            <input
              type="url"
              value={form.baseUrl}
              placeholder="https://api.example.com/v1"
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Default markup %">
            <input
              type="number"
              min={0}
              max={1000}
              step={0.01}
              value={form.defaultMarkupPct}
              onChange={(e) =>
                setForm({ ...form, defaultMarkupPct: e.target.value })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Notes" full>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className={inputCls}
              placeholder="Internal notes about this source"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Authentication"
        right={
          isEdit && source?.authConfigured && !replaceSecret ? (
            <button
              type="button"
              onClick={() => setReplaceSecret(true)}
              className="text-xs font-medium text-[var(--admin-accent)] hover:underline"
            >
              Replace credentials
            </button>
          ) : null
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Auth type">
            <select
              value={form.authType}
              onChange={(e) =>
                setForm({
                  ...form,
                  authType: e.target.value as SourceAuthType,
                })
              }
              className={inputCls}
            >
              {AUTH_TYPES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
          {isEdit && source?.authConfigured && !replaceSecret ? (
            <p className="self-end text-sm text-[var(--admin-fg)]/60">
              Existing credentials are preserved. Click &ldquo;Replace
              credentials&rdquo; to overwrite.
            </p>
          ) : (
            <AuthFields
              type={form.authType}
              auth={auth}
              setAuth={setAuth}
            />
          )}
        </div>
      </Section>

      <Section title="Supplier contact">
        <p className="mb-4 text-xs text-[var(--admin-fg)]/60">
          For a direct source, this is the real company you order from. Leave
          blank for aggregator feeds — those capture each supplier automatically
          from the import.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Supplier name">
            <input
              value={supplier.name}
              onChange={(e) => setSupplier({ ...supplier, name: e.target.value })}
              className={inputCls}
              placeholder="Acme Promotional Products"
            />
          </Field>
          <Field label="Website">
            <input
              type="url"
              value={supplier.website}
              onChange={(e) =>
                setSupplier({ ...supplier, website: e.target.value })
              }
              className={inputCls}
              placeholder="https://acme.com"
            />
          </Field>
          <Field label="Phone">
            <input
              value={supplier.phone}
              onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Alternate phone">
            <input
              value={supplier.altPhone}
              onChange={(e) =>
                setSupplier({ ...supplier, altPhone: e.target.value })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Toll-free">
            <input
              value={supplier.tollFree}
              onChange={(e) =>
                setSupplier({ ...supplier, tollFree: e.target.value })
              }
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      <Section title="Status">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Active (scheduled imports run automatically)
        </label>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Create Source"}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={handleTestConnection}
              className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--admin-muted)]"
            >
              Test connection
            </button>
          )}
        </div>
        {testResult && (
          <span
            className={`text-sm ${testResult.ok ? "text-emerald-600" : "text-red-600"}`}
          >
            {testResult.ok
              ? `OK · ${testResult.bytes} bytes · ${testResult.elapsedMs} ms`
              : `Failed: ${testResult.error}`}
          </span>
        )}
      </div>
    </form>
  );
}

/* ---- Sub-components. ---------------------------------------------------- */

const inputCls =
  "w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]";

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block space-y-1 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-[var(--admin-fg)]/70">
        {label}
      </span>
      {children}
    </label>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function AuthFields({
  type,
  auth,
  setAuth,
}: {
  type: SourceAuthType;
  auth: AuthState;
  setAuth: (next: AuthState) => void;
}) {
  if (type === "NONE") {
    return (
      <p className="self-end text-sm text-[var(--admin-fg)]/60">
        No credentials needed.
      </p>
    );
  }
  if (type === "API_KEY") {
    return (
      <>
        <Field label="API Key *">
          <input
            value={auth.apiKey}
            onChange={(e) => setAuth({ ...auth, apiKey: e.target.value })}
            className={inputCls}
            type="password"
            autoComplete="off"
          />
        </Field>
        <Field label="Header / param name">
          <input
            value={auth.apiKeyName}
            onChange={(e) => setAuth({ ...auth, apiKeyName: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Send via">
          <select
            value={auth.apiKeyIn}
            onChange={(e) =>
              setAuth({
                ...auth,
                apiKeyIn: e.target.value as "header" | "query",
              })
            }
            className={inputCls}
          >
            <option value="header">Header</option>
            <option value="query">Query string</option>
          </select>
        </Field>
      </>
    );
  }
  if (type === "BASIC") {
    return (
      <>
        <Field label="Username *">
          <input
            value={auth.basicUser}
            onChange={(e) => setAuth({ ...auth, basicUser: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Password *">
          <input
            value={auth.basicPass}
            onChange={(e) => setAuth({ ...auth, basicPass: e.target.value })}
            className={inputCls}
            type="password"
            autoComplete="off"
          />
        </Field>
      </>
    );
  }
  if (type === "BEARER") {
    return (
      <Field label="Bearer token *" full>
        <input
          value={auth.bearerToken}
          onChange={(e) => setAuth({ ...auth, bearerToken: e.target.value })}
          className={inputCls}
          type="password"
          autoComplete="off"
        />
      </Field>
    );
  }
  if (type === "ASI_MEMBER_AUTH") {
    return (
      <>
        <Field label="Client ID *">
          <input
            value={auth.asiClientId}
            onChange={(e) => setAuth({ ...auth, asiClientId: e.target.value })}
            className={inputCls}
            autoComplete="off"
          />
        </Field>
        <Field label="Client Secret *">
          <input
            value={auth.asiClientSecret}
            onChange={(e) =>
              setAuth({ ...auth, asiClientSecret: e.target.value })
            }
            className={inputCls}
            type="password"
            autoComplete="off"
          />
        </Field>
        <p className="sm:col-span-2 text-xs text-[var(--admin-fg)]/60">
          Sent as <code>Authorization: AsiMemberAuth client_id=…&amp;client_secret=…</code>.
        </p>
      </>
    );
  }
  return (
    <>
      <Field label="Token URL *">
        <input
          value={auth.oauthTokenUrl}
          onChange={(e) => setAuth({ ...auth, oauthTokenUrl: e.target.value })}
          className={inputCls}
          type="url"
        />
      </Field>
      <Field label="Client ID *">
        <input
          value={auth.oauthClientId}
          onChange={(e) => setAuth({ ...auth, oauthClientId: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Client Secret *">
        <input
          value={auth.oauthClientSecret}
          onChange={(e) =>
            setAuth({ ...auth, oauthClientSecret: e.target.value })
          }
          className={inputCls}
          type="password"
          autoComplete="off"
        />
      </Field>
      <Field label="Scope">
        <input
          value={auth.oauthScope}
          onChange={(e) => setAuth({ ...auth, oauthScope: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Audience" full>
        <input
          value={auth.oauthAudience}
          onChange={(e) => setAuth({ ...auth, oauthAudience: e.target.value })}
          className={inputCls}
          placeholder="(optional)"
        />
      </Field>
    </>
  );
}
