#!/usr/bin/env node
// Builds a fully static showcase of the admin UI into `apps/admin/out/`.
//
// Static export (`output: 'export'`) doesn't support proxy, route
// handlers, or `next/headers`. This script temporarily moves those files
// aside, runs `next build` with NEXT_PUBLIC_DEMO=1, then restores them.

import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const adminRoot = resolve(here, "..");
const stash = resolve(adminRoot, ".demo-build-stash");

const moves = [
  { src: join(adminRoot, "proxy.ts"), dest: join(stash, "proxy.ts") },
  { src: join(adminRoot, "app/api"), dest: join(stash, "app-api") },
];

// The admin group forces dynamic rendering in the real (server) build so that
// cookie-reading routes aren't prerendered as static. `output: "export"` can't
// use force-dynamic, so we strip that export for the static demo build.
const patches = [
  {
    file: join(adminRoot, "app/(admin)/layout.tsx"),
    strip: /^export const dynamic = "force-dynamic";\n/m,
  },
];

const patchBackup = (i) => join(stash, `patch-${i}.bak`);

function patchFiles() {
  patches.forEach(({ file, strip }, i) => {
    if (!existsSync(file)) return;
    const original = readFileSync(file, "utf8");
    const patched = original.replace(strip, "");
    if (patched === original) return;
    writeFileSync(patchBackup(i), original);
    writeFileSync(file, patched);
    console.log(`  ↳ stripped force-dynamic from ${file}`);
  });
}

function restoreFiles() {
  patches.forEach(({ file }, i) => {
    const backup = patchBackup(i);
    if (!existsSync(backup)) return;
    writeFileSync(file, readFileSync(backup, "utf8"));
    rmSync(backup, { force: true });
    console.log(`  ↳ restored ${file}`);
  });
}

function stashPaths() {
  mkdirSync(stash, { recursive: true });
  for (const { src, dest } of moves) {
    if (existsSync(src) && !existsSync(dest)) {
      renameSync(src, dest);
      console.log(`  ↳ moved ${src} → ${dest}`);
    }
  }
}

function restorePaths() {
  for (const { src, dest } of moves) {
    if (existsSync(dest)) {
      if (existsSync(src)) {
        console.warn(`  ! ${src} already exists; removing stashed copy`);
        rmSync(dest, { recursive: true, force: true });
      } else {
        renameSync(dest, src);
        console.log(`  ↳ restored ${src}`);
      }
    }
  }
  if (existsSync(stash)) {
    try {
      rmSync(stash, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

let exitCode = 0;
console.log("▶ Sidelining server-only files for static export…");
stashPaths();
patchFiles();

try {
  console.log("▶ Running next build (NEXT_PUBLIC_DEMO=1)…");
  execSync("next build", {
    cwd: adminRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_DEMO: "1",
    },
  });
  console.log("\n✓ Demo build ready at apps/admin/out/");
} catch (err) {
  exitCode = err && typeof err === "object" && "status" in err ? Number(err.status) || 1 : 1;
  console.error("✗ Demo build failed");
} finally {
  console.log("▶ Restoring sidelined files…");
  restoreFiles();
  restorePaths();
}

process.exit(exitCode);
