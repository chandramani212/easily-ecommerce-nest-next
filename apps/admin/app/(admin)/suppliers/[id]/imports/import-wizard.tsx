"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clientApi,
  DemoReadOnlyError,
} from "../../../../../lib/client-api";
import type {
  SupplierImport,
  SupplierImportFormat,
} from "../../../../../lib/types";

/* ---- Mapping shape (mirrors apps/api/src/suppliers/runner/mapping.types.ts). */

type FieldTransform =
  | "string"
  | "lower"
  | "upper"
  | "trim"
  | "slugify"
  | "int"
  | "float"
  | "money"
  | "bool"
  | "split";

interface SimpleField {
  path?: string;
  literal?: string | number | boolean | null;
  template?: string;
  transforms?: FieldTransform[];
  splitSeparator?: string;
}

interface AttributeMapItem {
  name: string;
  value: SimpleField;
}

interface TierMapItem {
  minQuantity: SimpleField;
  price: SimpleField;
  type?: "FIXED" | "PERCENTAGE";
}

interface ImagesMap {
  source: SimpleField;
  separator?: string;
  baseUrl?: string;
  urlSuffix?: string;
  featuredSource?: SimpleField;
  download?: boolean;
}

interface CategoriesMap {
  source: SimpleField;
  separator?: string;
  match?: "name" | "slug" | "create";
  itemExternalIdPath?: string;
  itemNamePath?: string;
  itemParentExternalIdPath?: string;
  itemParentNamePath?: string;
}

interface MappingSpec {
  externalId: SimpleField;
  name: SimpleField;
  sku: SimpleField;
  shortDescription?: SimpleField;
  description?: SimpleField;
  basePrice?: SimpleField;
  sellingPrice?: SimpleField;
  active?: SimpleField;
  attributes?: AttributeMapItem[];
  images?: ImagesMap;
  categories?: CategoriesMap;
  tiers?: TierMapItem[];
}

interface MarkupSpec {
  kind: "percent" | "fixed";
  value: number;
  appliesTo?: ("basePrice" | "sellingPrice")[];
}

/* ---- Field metadata for the two-column mapper. ------------------------- */

interface ProductField {
  key: keyof MappingSpec | string;
  label: string;
  required?: boolean;
  group: "identity" | "content" | "pricing" | "flag";
}

const PRODUCT_FIELDS: ProductField[] = [
  { key: "externalId", label: "External ID *", required: true, group: "identity" },
  { key: "name", label: "Product name *", required: true, group: "identity" },
  { key: "sku", label: "SKU *", required: true, group: "identity" },
  { key: "shortDescription", label: "Short description", group: "content" },
  { key: "description", label: "Long description", group: "content" },
  { key: "basePrice", label: "Base price (MSRP)", group: "pricing" },
  { key: "sellingPrice", label: "Selling price", group: "pricing" },
  { key: "active", label: "Active flag", group: "flag" },
];

const FIELD_TRANSFORMS: { value: FieldTransform; label: string }[] = [
  { value: "trim", label: "Trim" },
  { value: "lower", label: "lowercase" },
  { value: "upper", label: "UPPERCASE" },
  { value: "slugify", label: "Slugify" },
  { value: "int", label: "Integer" },
  { value: "float", label: "Decimal" },
  { value: "money", label: "Money (strip $)" },
  { value: "bool", label: "Boolean" },
  { value: "string", label: "Force string" },
];

/* ---- Component. -------------------------------------------------------- */

export function ImportWizard({
  supplierId,
  imp,
}: {
  supplierId: string;
  imp?: SupplierImport;
}) {
  const router = useRouter();
  const isEdit = !!imp;

  const [name, setName] = useState(imp?.name ?? "");
  const [format, setFormat] = useState<SupplierImportFormat>(
    imp?.format ?? "JSON",
  );
  const [endpoint, setEndpoint] = useState(imp?.endpoint ?? "");
  const [httpMethod, setHttpMethod] = useState(imp?.httpMethod ?? "GET");
  const [headersText, setHeadersText] = useState(
    imp?.headers ? JSON.stringify(imp.headers, null, 2) : "{}",
  );
  const [body, setBody] = useState(imp?.body ?? "");
  const [recordsPath, setRecordsPath] = useState(imp?.recordsPath ?? "$");
  const [cron, setCron] = useState(imp?.cron ?? "");
  const [active, setActive] = useState(imp?.active ?? true);
  const [autoDeactivate, setAutoDeactivate] = useState(
    imp?.autoDeactivateMissing ?? false,
  );

  const [mapping, setMapping] = useState<MappingSpec>(() => {
    const m = imp?.mapping as MappingSpec | undefined;
    return {
      externalId: m?.externalId ?? { path: "" },
      name: m?.name ?? { path: "" },
      sku: m?.sku ?? { path: "" },
      shortDescription: m?.shortDescription,
      description: m?.description,
      basePrice: m?.basePrice,
      sellingPrice: m?.sellingPrice,
      active: m?.active,
      attributes: m?.attributes ?? [],
      images: m?.images,
      categories: m?.categories,
      tiers: m?.tiers ?? [],
    };
  });

  const [markup, setMarkup] = useState<MarkupSpec>(() => {
    const mk = imp?.markup as MarkupSpec | undefined;
    return {
      kind: mk?.kind ?? "percent",
      value: mk?.value ?? 0,
      appliesTo: mk?.appliesTo ?? ["sellingPrice"],
    };
  });

  // Sample state (for dry runs and field suggestions).
  const [samplePaths, setSamplePaths] = useState<string[]>([]);
  const [sampleRecord, setSampleRecord] = useState<unknown>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState<unknown>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cronPreview, setCronPreview] = useState<string[] | null>(null);

  /* ---- Cron live preview. -------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    if (!cron.trim()) {
      setCronPreview([]);
      return;
    }
    void clientApi<{ valid: boolean; next: string[] }>(
      `/suppliers/cron-preview?expression=${encodeURIComponent(cron)}&count=3`,
    )
      .then((r) => {
        if (!cancelled) setCronPreview(r.valid ? r.next : null);
      })
      .catch(() => {
        if (!cancelled) setCronPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [cron]);

  function buildPayload() {
    let parsedHeaders: Record<string, string> = {};
    try {
      parsedHeaders = headersText.trim() ? JSON.parse(headersText) : {};
    } catch {
      throw new Error("Headers must be valid JSON.");
    }
    return {
      name,
      format,
      endpoint: endpoint || undefined,
      httpMethod,
      headers: parsedHeaders,
      body: body || undefined,
      recordsPath: recordsPath || "$",
      mapping: mapping as unknown as Record<string, unknown>,
      markup: markup as unknown as Record<string, unknown>,
      cron,
      active,
      autoDeactivateMissing: autoDeactivate,
    };
  }

  async function handleSave() {
    setError(null);
    setBusy("save");
    try {
      const payload = buildPayload();
      const url = isEdit
        ? `/suppliers/${supplierId}/imports/${imp.id}`
        : `/suppliers/${supplierId}/imports`;
      const result = await clientApi<SupplierImport>(url, {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      router.push(`/suppliers/${supplierId}/imports/${result.id}`);
      router.refresh();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleSample() {
    if (!isEdit) {
      setError("Save the import first, then fetch a sample.");
      return;
    }
    setError(null);
    setBusy("sample");
    try {
      let body: BodyInit | undefined;
      if (sampleFile) {
        const fd = new FormData();
        fd.append("file", sampleFile);
        body = fd;
      } else {
        body = JSON.stringify({});
      }
      const result = await clientApi<{
        total: number;
        sampleRecord: unknown;
        paths: string[];
      }>(`/suppliers/${supplierId}/imports/${imp.id}/sample`, {
        method: "POST",
        body,
      });
      setSamplePaths(result.paths);
      setSampleRecord(result.sampleRecord);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleDryRun() {
    if (!isEdit) {
      setError("Save the import first, then run a dry test.");
      return;
    }
    setError(null);
    setBusy("dryRun");
    try {
      let body: BodyInit | undefined;
      if (sampleFile) {
        const fd = new FormData();
        fd.append("file", sampleFile);
        fd.append("limit", "10");
        body = fd;
      } else {
        body = JSON.stringify({ limit: 10 });
      }
      const result = await clientApi(
        `/suppliers/${supplierId}/imports/${imp.id}/dry-run`,
        { method: "POST", body },
      );
      setDryRun(result);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(null);
    }
  }

  /* ---- UI. ----------------------------------------------------------- */

  const headersValid = useMemo(() => {
    try {
      if (headersText.trim()) JSON.parse(headersText);
      return true;
    } catch {
      return false;
    }
  }, [headersText]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Section title="Source">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name *">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Format *">
            <select
              value={format}
              onChange={(e) =>
                setFormat(e.target.value as SupplierImportFormat)
              }
              className={inputCls}
            >
              <option value="JSON">JSON</option>
              <option value="XML">XML</option>
              <option value="CSV">CSV</option>
            </select>
          </Field>
          <Field label="HTTP Method">
            <select
              value={httpMethod}
              onChange={(e) => setHttpMethod(e.target.value)}
              className={inputCls}
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
            </select>
          </Field>
          <Field label="Endpoint URL or path">
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/products or https://…/products.json"
              className={inputCls}
            />
          </Field>
          <Field label="Records path" hint="JSONPath / XPath-ish selecting the array of records">
            <input
              value={recordsPath}
              onChange={(e) => setRecordsPath(e.target.value)}
              className={`${inputCls} font-mono`}
              placeholder="$.data.products"
            />
          </Field>
          <Field label="Headers (JSON)">
            <textarea
              value={headersText}
              onChange={(e) => setHeadersText(e.target.value)}
              rows={3}
              className={`${inputCls} font-mono text-xs ${
                headersValid ? "" : "border-red-400"
              }`}
            />
          </Field>
          {httpMethod !== "GET" && (
            <Field label="Body" full>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                className={`${inputCls} font-mono text-xs`}
              />
            </Field>
          )}
        </div>
      </Section>

      <Section
        title="Field Mapping"
        right={
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json,.xml,.csv,application/json,text/xml,text/csv"
              onChange={(e) => setSampleFile(e.target.files?.[0] ?? null)}
              className="text-xs"
            />
            <button
              type="button"
              onClick={handleSample}
              disabled={!isEdit || busy !== null}
              className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--admin-muted)] disabled:opacity-60"
            >
              {busy === "sample" ? "Loading…" : "Load sample"}
            </button>
          </div>
        }
      >
        <p className="mb-3 text-xs text-[var(--admin-fg)]/60">
          Map each product field on the left to a path in the supplier record on
          the right. Click a path in the suggestions panel to fill the closest
          empty field.
        </p>

        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="space-y-3">
            {PRODUCT_FIELDS.map((f) => (
              <FieldRow
                key={f.key as string}
                field={f}
                value={
                  (mapping as unknown as Record<string, SimpleField | undefined>)[
                    f.key as string
                  ]
                }
                onChange={(next) =>
                  setMapping({
                    ...mapping,
                    [f.key]: next,
                  } as MappingSpec)
                }
              />
            ))}

            <SubMapper
              title="Images"
              hint="Single string (with separator) or an array path."
              enabled={!!mapping.images}
              onToggle={(on) =>
                setMapping({
                  ...mapping,
                  images: on
                    ? mapping.images ?? { source: { path: "" }, separator: "," }
                    : undefined,
                })
              }
            >
              {mapping.images && (
                <>
                  <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                    <SimpleFieldEditor
                      value={mapping.images.source}
                      onChange={(next) =>
                        setMapping({
                          ...mapping,
                          images: { ...mapping.images!, source: next },
                        })
                      }
                    />
                    <input
                      placeholder="Separator (e.g. ,)"
                      value={mapping.images.separator ?? ""}
                      onChange={(e) =>
                        setMapping({
                          ...mapping,
                          images: {
                            ...mapping.images!,
                            separator: e.target.value,
                          },
                        })
                      }
                      className={inputCls}
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field
                      label="Base URL (optional)"
                      hint="Prepended to relative URLs. Example: https://api.uat-asicentral.com/v1"
                    >
                      <input
                        placeholder="https://api.uat-asicentral.com/v1"
                        value={mapping.images.baseUrl ?? ""}
                        onChange={(e) =>
                          setMapping({
                            ...mapping,
                            images: {
                              ...mapping.images!,
                              baseUrl: e.target.value || undefined,
                            },
                          })
                        }
                        className={inputCls}
                      />
                    </Field>
                    <Field
                      label="URL suffix (optional)"
                      hint="Appended to every URL. Example: ?size=normal"
                    >
                      <input
                        placeholder="?size=normal"
                        value={mapping.images.urlSuffix ?? ""}
                        onChange={(e) =>
                          setMapping({
                            ...mapping,
                            images: {
                              ...mapping.images!,
                              urlSuffix: e.target.value || undefined,
                            },
                          })
                        }
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <div className="rounded-md border border-dashed border-[var(--admin-border)] p-2">
                    <label className="mb-1 flex items-center gap-2 text-xs font-medium text-[var(--admin-fg)]/80">
                      <input
                        type="checkbox"
                        checked={!!mapping.images.featuredSource}
                        onChange={(e) =>
                          setMapping({
                            ...mapping,
                            images: {
                              ...mapping.images!,
                              featuredSource: e.target.checked
                                ? mapping.images!.featuredSource ?? { path: "" }
                                : undefined,
                            },
                          })
                        }
                      />
                      Featured image (separate path)
                    </label>
                    {mapping.images.featuredSource && (
                      <SimpleFieldEditor
                        value={mapping.images.featuredSource}
                        onChange={(next) =>
                          setMapping({
                            ...mapping,
                            images: {
                              ...mapping.images!,
                              featuredSource: next,
                            },
                          })
                        }
                        placeholder="Path to primary image (e.g. ImageUrl)"
                      />
                    )}
                    <p className="mt-1 text-[11px] text-[var(--admin-fg)]/50">
                      Resolved to a single URL and placed at position 0 of the
                      gallery. Duplicates with the main source are removed.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={!!mapping.images.download}
                      onChange={(e) =>
                        setMapping({
                          ...mapping,
                          images: {
                            ...mapping.images!,
                            download: e.target.checked || undefined,
                          },
                        })
                      }
                    />
                    Download images into the local media library
                  </label>
                </>
              )}
            </SubMapper>

            <SubMapper
              title="Categories"
              hint="Point at the source path, then either configure hierarchy (recommended) or use flat-string mode."
              enabled={!!mapping.categories}
              onToggle={(on) =>
                setMapping({
                  ...mapping,
                  categories: on
                    ? mapping.categories ?? {
                        source: { path: "" },
                        separator: ",",
                        match: "create",
                      }
                    : undefined,
                })
              }
            >
              {mapping.categories && (
                <>
                  <Field label="Source path" hint="Path to the categories array or string on each record.">
                    <SimpleFieldEditor
                      value={mapping.categories.source}
                      onChange={(next) =>
                        setMapping({
                          ...mapping,
                          categories: {
                            ...mapping.categories!,
                            source: next,
                          },
                        })
                      }
                    />
                  </Field>

                  <div className="rounded-md border border-dashed border-[var(--admin-border)] p-2">
                    <p className="mb-2 text-xs font-medium text-[var(--admin-fg)]/80">
                      Hierarchy mode (set the four paths below when the source
                      is an array of objects like ASI&apos;s {`{Id, Name, Parent: {Id, Name}}`}).
                    </p>
                    <p className="mb-2 text-[11px] text-[var(--admin-fg)]/60">
                      With hierarchy mode on, supplier categories are recorded
                      in the Supplier Categories page and the storefront only
                      shows them once you map them to a curated category.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field label="External ID path" hint="e.g. Id">
                        <input
                          placeholder="Id"
                          value={mapping.categories.itemExternalIdPath ?? ""}
                          onChange={(e) =>
                            setMapping({
                              ...mapping,
                              categories: {
                                ...mapping.categories!,
                                itemExternalIdPath: e.target.value || undefined,
                              },
                            })
                          }
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Name path" hint="e.g. Name">
                        <input
                          placeholder="Name"
                          value={mapping.categories.itemNamePath ?? ""}
                          onChange={(e) =>
                            setMapping({
                              ...mapping,
                              categories: {
                                ...mapping.categories!,
                                itemNamePath: e.target.value || undefined,
                              },
                            })
                          }
                          className={inputCls}
                        />
                      </Field>
                      <Field
                        label="Parent external ID path"
                        hint="e.g. Parent.Id (optional)"
                      >
                        <input
                          placeholder="Parent.Id"
                          value={mapping.categories.itemParentExternalIdPath ?? ""}
                          onChange={(e) =>
                            setMapping({
                              ...mapping,
                              categories: {
                                ...mapping.categories!,
                                itemParentExternalIdPath:
                                  e.target.value || undefined,
                              },
                            })
                          }
                          className={inputCls}
                        />
                      </Field>
                      <Field
                        label="Parent name path"
                        hint="e.g. Parent.Name (optional)"
                      >
                        <input
                          placeholder="Parent.Name"
                          value={mapping.categories.itemParentNamePath ?? ""}
                          onChange={(e) =>
                            setMapping({
                              ...mapping,
                              categories: {
                                ...mapping.categories!,
                                itemParentNamePath:
                                  e.target.value || undefined,
                              },
                            })
                          }
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </div>

                  {!mapping.categories.itemExternalIdPath && (
                    <div className="rounded-md border border-dashed border-[var(--admin-border)] p-2">
                      <p className="mb-2 text-xs font-medium text-[var(--admin-fg)]/80">
                        Flat-string mode (legacy)
                      </p>
                      <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
                        <input
                          placeholder="Separator"
                          value={mapping.categories.separator ?? ","}
                          onChange={(e) =>
                            setMapping({
                              ...mapping,
                              categories: {
                                ...mapping.categories!,
                                separator: e.target.value,
                              },
                            })
                          }
                          className={inputCls}
                        />
                        <select
                          value={mapping.categories.match ?? "create"}
                          onChange={(e) =>
                            setMapping({
                              ...mapping,
                              categories: {
                                ...mapping.categories!,
                                match: e.target.value as
                                  | "name"
                                  | "slug"
                                  | "create",
                              },
                            })
                          }
                          className={inputCls}
                        >
                          <option value="create">Create missing</option>
                          <option value="name">Match by name</option>
                          <option value="slug">Match by slug</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}
            </SubMapper>

            <SubMapper
              title="Attributes"
              hint="Static attribute name + dynamic value from the record."
              enabled={(mapping.attributes?.length ?? 0) > 0}
              onToggle={(on) =>
                setMapping({
                  ...mapping,
                  attributes: on ? [{ name: "", value: { path: "" } }] : [],
                })
              }
            >
              {(mapping.attributes ?? []).map((attr, i) => (
                <div
                  key={i}
                  className="grid gap-2 sm:grid-cols-[160px_1fr_30px]"
                >
                  <input
                    placeholder="Attribute name"
                    value={attr.name}
                    onChange={(e) =>
                      setMapping({
                        ...mapping,
                        attributes: replaceAt(mapping.attributes!, i, {
                          ...attr,
                          name: e.target.value,
                        }),
                      })
                    }
                    className={inputCls}
                  />
                  <SimpleFieldEditor
                    value={attr.value}
                    onChange={(next) =>
                      setMapping({
                        ...mapping,
                        attributes: replaceAt(mapping.attributes!, i, {
                          ...attr,
                          value: next,
                        }),
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMapping({
                        ...mapping,
                        attributes: removeAt(mapping.attributes!, i),
                      })
                    }
                    className="rounded-md border border-[var(--admin-border)] text-xs"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {(mapping.attributes?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setMapping({
                      ...mapping,
                      attributes: [
                        ...(mapping.attributes ?? []),
                        { name: "", value: { path: "" } },
                      ],
                    })
                  }
                  className="text-xs font-medium text-[var(--admin-accent)]"
                >
                  + Add attribute
                </button>
              )}
            </SubMapper>

            <SubMapper
              title="Tier prices"
              hint="Repeating quantity break + price (FIXED or PERCENTAGE)."
              enabled={(mapping.tiers?.length ?? 0) > 0}
              onToggle={(on) =>
                setMapping({
                  ...mapping,
                  tiers: on
                    ? [
                        {
                          minQuantity: { path: "" },
                          price: { path: "" },
                          type: "FIXED",
                        },
                      ]
                    : [],
                })
              }
            >
              {(mapping.tiers ?? []).map((t, i) => (
                <div
                  key={i}
                  className="grid gap-2 sm:grid-cols-[1fr_1fr_120px_30px]"
                >
                  <SimpleFieldEditor
                    value={t.minQuantity}
                    onChange={(next) =>
                      setMapping({
                        ...mapping,
                        tiers: replaceAt(mapping.tiers!, i, {
                          ...t,
                          minQuantity: next,
                        }),
                      })
                    }
                    placeholder="Min qty path"
                  />
                  <SimpleFieldEditor
                    value={t.price}
                    onChange={(next) =>
                      setMapping({
                        ...mapping,
                        tiers: replaceAt(mapping.tiers!, i, {
                          ...t,
                          price: next,
                        }),
                      })
                    }
                    placeholder="Price path"
                  />
                  <select
                    value={t.type ?? "FIXED"}
                    onChange={(e) =>
                      setMapping({
                        ...mapping,
                        tiers: replaceAt(mapping.tiers!, i, {
                          ...t,
                          type: e.target.value as "FIXED" | "PERCENTAGE",
                        }),
                      })
                    }
                    className={inputCls}
                  >
                    <option value="FIXED">Fixed price</option>
                    <option value="PERCENTAGE">% discount</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setMapping({
                        ...mapping,
                        tiers: removeAt(mapping.tiers!, i),
                      })
                    }
                    className="rounded-md border border-[var(--admin-border)] text-xs"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {(mapping.tiers?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setMapping({
                      ...mapping,
                      tiers: [
                        ...(mapping.tiers ?? []),
                        {
                          minQuantity: { path: "" },
                          price: { path: "" },
                          type: "FIXED",
                        },
                      ],
                    })
                  }
                  className="text-xs font-medium text-[var(--admin-accent)]"
                >
                  + Add tier
                </button>
              )}
            </SubMapper>
          </div>

          <aside className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase text-[var(--admin-fg)]/60">
              Source paths
            </h4>
            {samplePaths.length === 0 ? (
              <p className="text-xs text-[var(--admin-fg)]/60">
                Load a sample to see suggested paths.
              </p>
            ) : (
              <ul className="max-h-96 space-y-1 overflow-auto text-xs">
                {samplePaths.map((p) => (
                  <li
                    key={p}
                    className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-[var(--admin-fg)]/80 hover:bg-[var(--admin-muted)]"
                    title="Click to copy"
                    onClick={() => navigator.clipboard?.writeText(p)}
                  >
                    {p}
                  </li>
                ))}
              </ul>
            )}
            {sampleRecord !== null && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-[var(--admin-fg)]/70">
                  Sample record
                </summary>
                <pre className="mt-2 max-h-72 overflow-auto rounded bg-[var(--admin-card)] p-2 text-[10px] leading-tight">
                  {JSON.stringify(sampleRecord, null, 2)}
                </pre>
              </details>
            )}
          </aside>
        </div>
      </Section>

      <Section title="Pricing markup">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Type">
            <select
              value={markup.kind}
              onChange={(e) =>
                setMarkup({
                  ...markup,
                  kind: e.target.value as "percent" | "fixed",
                })
              }
              className={inputCls}
            >
              <option value="percent">Percent</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </Field>
          <Field label="Value">
            <input
              type="number"
              step={0.01}
              value={markup.value}
              onChange={(e) =>
                setMarkup({ ...markup, value: Number(e.target.value) })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Applies to">
            <div className="flex flex-col gap-1 text-sm">
              {(["basePrice", "sellingPrice"] as const).map((p) => (
                <label key={p} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={markup.appliesTo?.includes(p) ?? false}
                    onChange={(e) => {
                      const next = new Set(markup.appliesTo ?? []);
                      if (e.target.checked) next.add(p);
                      else next.delete(p);
                      setMarkup({ ...markup, appliesTo: [...next] });
                    }}
                  />
                  {p === "basePrice" ? "Base price" : "Selling price"}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Schedule">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Cron expression"
            hint='Standard 5-field cron. Leave blank to disable scheduled runs (manual still works).'
          >
            <input
              value={cron}
              onChange={(e) => setCron(e.target.value)}
              className={`${inputCls} font-mono`}
              placeholder="0 */6 * * *"
            />
            {cron.trim() && (
              <p className="mt-1 text-xs text-[var(--admin-fg)]/60">
                {cronPreview === null
                  ? "Invalid cron expression."
                  : cronPreview.length === 0
                    ? ""
                    : `Next runs: ${cronPreview
                        .map((d) => new Date(d).toLocaleString())
                        .join(" · ")}`}
              </p>
            )}
          </Field>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoDeactivate}
                onChange={(e) => setAutoDeactivate(e.target.checked)}
              />
              Deactivate products missing from a successful sync
            </label>
          </div>
        </div>
      </Section>

      <Section
        title="Review & dry-run"
        right={
          <button
            type="button"
            onClick={handleDryRun}
            disabled={!isEdit || busy !== null}
            className="rounded-md border border-[var(--admin-border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--admin-muted)] disabled:opacity-60"
          >
            {busy === "dryRun" ? "Running…" : "Run dry-run"}
          </button>
        }
      >
        {!isEdit ? (
          <p className="text-sm text-[var(--admin-fg)]/60">
            Save the import first to enable dry-run preview.
          </p>
        ) : dryRun ? (
          <pre className="max-h-96 overflow-auto rounded bg-[var(--admin-card)] p-3 text-[11px] leading-tight">
            {JSON.stringify(dryRun, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-[var(--admin-fg)]/60">
            Click &ldquo;Run dry-run&rdquo; to fetch up to 10 records, apply the
            mapping, and preview the result without writing to the database.
          </p>
        )}
      </Section>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy !== null}
          className="rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {busy === "save"
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create import"}
        </button>
      </div>
    </div>
  );
}

/* ---- Helpers / sub-components. ----------------------------------------- */

const inputCls =
  "w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--admin-accent)]";

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

function Field({
  label,
  hint,
  full,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block space-y-1 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-[var(--admin-fg)]/70">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] text-[var(--admin-fg)]/50">
          {hint}
        </span>
      )}
    </label>
  );
}

function SubMapper({
  title,
  hint,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  hint: string;
  enabled: boolean;
  onToggle: (on: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold">{title}</span>
          <p className="text-[11px] text-[var(--admin-fg)]/60">{hint}</p>
        </div>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          Enabled
        </label>
      </div>
      {enabled && <div className="space-y-2">{children}</div>}
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: ProductField;
  value?: SimpleField;
  onChange: (next: SimpleField | undefined) => void;
}) {
  return (
    <div className="grid items-center gap-3 sm:grid-cols-[180px_1fr]">
      <span className="text-sm font-medium text-[var(--admin-fg)]/80">
        {field.label}
      </span>
      <SimpleFieldEditor
        value={value ?? { path: "" }}
        onChange={onChange}
        placeholder={field.required ? "Required path" : "(optional)"}
      />
    </div>
  );
}

function SimpleFieldEditor({
  value,
  onChange,
  placeholder,
}: {
  value: SimpleField;
  onChange: (next: SimpleField) => void;
  placeholder?: string;
}) {
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(value.transforms?.length || value.template || value.literal),
  );
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          value={value.path ?? ""}
          onChange={(e) => onChange({ ...value, path: e.target.value })}
          placeholder={placeholder ?? "$.field.path"}
          className={`${inputCls} font-mono text-xs`}
        />
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-medium text-[var(--admin-accent)] hover:underline"
        >
          {showAdvanced ? "Less" : "More"}
        </button>
      </div>
      {showAdvanced && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={value.template ?? ""}
            onChange={(e) =>
              onChange({ ...value, template: e.target.value || undefined })
            }
            placeholder="Template e.g. {{name}} ({{sku}})"
            className={`${inputCls} text-xs`}
          />
          <input
            value={value.literal === undefined ? "" : String(value.literal)}
            onChange={(e) =>
              onChange({
                ...value,
                literal: e.target.value === "" ? undefined : e.target.value,
              })
            }
            placeholder="Literal value"
            className={`${inputCls} text-xs`}
          />
          <select
            multiple
            value={value.transforms ?? []}
            onChange={(e) =>
              onChange({
                ...value,
                transforms: Array.from(e.target.selectedOptions).map(
                  (o) => o.value as FieldTransform,
                ),
              })
            }
            className={`${inputCls} h-24 text-xs`}
          >
            {FIELD_TRANSFORMS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            value={value.splitSeparator ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                splitSeparator: e.target.value || undefined,
              })
            }
            placeholder="Split separator (default ,)"
            className={`${inputCls} text-xs`}
          />
        </div>
      )}
    </div>
  );
}

function replaceAt<T>(arr: T[], i: number, next: T): T[] {
  const out = [...arr];
  out[i] = next;
  return out;
}
function removeAt<T>(arr: T[], i: number): T[] {
  const out = [...arr];
  out.splice(i, 1);
  return out;
}

function messageOf(err: unknown): string {
  if (err instanceof DemoReadOnlyError) return err.message;
  if (err instanceof Error) return err.message;
  return String(err);
}
