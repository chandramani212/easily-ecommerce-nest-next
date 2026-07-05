"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { clientApi } from "../../../lib/client-api";

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this category? This cannot be undone.")) return;
    setBusy(true);
    try {
      await clientApi(`/categories/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
