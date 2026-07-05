"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { clientApi } from "../../../lib/client-api";

/**
 * Up/down controls that reorder a category within its sibling group (same
 * parent). `siblingIds` is the current order of that group; a move swaps this
 * id with its neighbour and persists the whole group via PATCH /categories/reorder.
 */
export function ReorderButtons({
  id,
  siblingIds,
}: {
  id: string;
  siblingIds: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const index = siblingIds.indexOf(id);
  const isFirst = index <= 0;
  const isLast = index === siblingIds.length - 1;

  async function move(dir: -1 | 1) {
    const target = index + dir;
    if (index < 0 || target < 0 || target >= siblingIds.length) return;
    const next = [...siblingIds];
    const moved = next[index]!;
    next[index] = next[target]!;
    next[target] = moved;
    setBusy(true);
    try {
      await clientApi("/categories/reorder", {
        method: "PATCH",
        body: JSON.stringify({ ids: next }),
      });
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Reorder failed");
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "flex h-5 w-6 items-center justify-center rounded border border-[var(--admin-border)] text-[10px] leading-none hover:bg-[var(--admin-muted)] disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => move(-1)}
        disabled={busy || isFirst}
        aria-label="Move up"
        className={btn}
      >
        ▲
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        disabled={busy || isLast}
        aria-label="Move down"
        className={btn}
      >
        ▼
      </button>
    </div>
  );
}
