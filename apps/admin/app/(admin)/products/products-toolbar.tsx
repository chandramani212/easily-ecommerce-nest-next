"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function ProductsToolbar() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<"import" | "export" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleExport() {
    setBusy("export");
    try {
      const res = await fetch("/api/proxy/products/export", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleImport(file: File) {
    setBusy("import");
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/proxy/products/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        created?: number;
        updated?: number;
        errors?: { row: number; error: string }[];
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || "Import failed");
      }
      const errCount = data.errors?.length ?? 0;
      setMessage(
        `Created ${data.created ?? 0}, updated ${data.updated ?? 0}` +
          (errCount ? ` · ${errCount} error${errCount === 1 ? "" : "s"}` : ""),
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImport(file);
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy !== null}
        className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--admin-muted)] disabled:opacity-50"
      >
        {busy === "import" ? "Importing…" : "Import CSV"}
      </button>
      <button
        onClick={handleExport}
        disabled={busy !== null}
        className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--admin-muted)] disabled:opacity-50"
      >
        {busy === "export" ? "Exporting…" : "Export CSV"}
      </button>
      {message && (
        <span className="text-xs text-[var(--admin-fg)]/60">{message}</span>
      )}
    </div>
  );
}
