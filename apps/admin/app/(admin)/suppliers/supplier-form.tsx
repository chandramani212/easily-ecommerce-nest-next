"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { clientApi, DemoReadOnlyError } from "../../../lib/client-api";
import type {
  Supplier,
  SupplierAuthType,
  SupplierKind,
} from "../../../lib/types";

const AUTH_TYPES: { value: SupplierAuthType; label: string }[] = [
  { value: "NONE", label: "None" },
  { value: "API_KEY", label: "API Key" },
  { value: "BASIC", label: "Basic Auth" },
  { value: "BEARER", label: "Bearer Token" },
  { value: "OAUTH2_CLIENT_CREDENTIALS", label: "OAuth2 Client Credentials" },
];

interface FormState {
  name: string;
  kind: SupplierKind;
  baseUrl: string;
  authType: SupplierAuthType;
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
};

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: supplier?.name ?? "",
    kind: supplier?.kind ?? "REST",
    baseUrl: supplier?.baseUrl ?? "",
    authType: supplier?.authType ?? "NONE",
    defaultMarkupPct: String(supplier?.defaultMarkupPct ?? 0),
    notes: supplier?.notes ?? "",
    active: supplier?.active ?? true,
  });
  const [auth, setAuth] = useState<AuthState>(EMPTY_AUTH);
  /** When editing, leave secret blank to keep existing creds. */
  const [replaceSecret, setReplaceSecret] = useState(!supplier);
  const [submitting, setSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<
    | { ok: true; elapsedMs: number; bytes: number; contentType: string | null }
    | { ok: false; elapsedMs: number; error: string }
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!supplier;

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
      const url = isEdit ? `/suppliers/${supplier.id}` : "/suppliers";
      const result = await clientApi<Supplier>(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      router.push(`/suppliers/${result.id}`);
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
      setError("Save the supplier first, then test the connection.");
      return;
    }
    setTestResult(null);
    try {
      const r = await clientApi<typeof testResult>(
        `/suppliers/${supplier.id}/test-connection`,
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
                setForm({ ...form, kind: e.target.value as SupplierKind })
              }
              className={inputCls}
            >
              <option value="REST">REST API</option>
              <option value="FILE_FEED">File feed (upload per run)</option>
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
              placeholder="Internal notes about this supplier"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Authentication"
        right={
          isEdit && supplier?.authConfigured && !replaceSecret ? (
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
                  authType: e.target.value as SupplierAuthType,
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
          {isEdit && supplier?.authConfigured && !replaceSecret ? (
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
                : "Create Supplier"}
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
  type: SupplierAuthType;
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
