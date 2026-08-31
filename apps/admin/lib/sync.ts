import { writeFile } from "fs/promises";
import path from "path";
import { simpleGit } from "simple-git";
import { fetchFullTree } from "./db";

/**
 * Regenerates apps/public/data/tree.json from the database and pushes it to
 * the git repo that Netlify is watching, so the public site picks up the
 * change on its next auto-deploy.
 *
 * SITE_REPO_PATH (in .env.local) should point at the root of THIS monorepo's
 * git checkout — the same one containing apps/public — since that's what's
 * connected to Netlify.
 */
export async function syncToPublicSite(): Promise<void> {
  const tree = await fetchFullTree();

  const repoPath = process.env.SITE_REPO_PATH;
  if (!repoPath) {
    console.warn("[sync] SITE_REPO_PATH is not set — skipping git sync (wrote tree.json locally only).");
    return;
  }

  const targetFile = path.join(repoPath, "apps", "public", "data", "tree.json");
  await writeFile(targetFile, JSON.stringify(tree, null, 2), "utf-8");

  try {
    const git = simpleGit(repoPath);
    await git.add("apps/public/data/tree.json");
    const status = await git.status();
    if (status.staged.length === 0) {
      return; // nothing changed (e.g. identical data) — nothing to commit
    }
    await git.commit(`sync: update family tree data (${new Date().toISOString()})`);
    await git.push("origin", "main");
    console.log("[sync] Pushed updated tree.json — Netlify will redeploy shortly.");
  } catch (err) {
    // Don't fail the whole API request just because the push failed (e.g. no
    // network, or a merge conflict) — the DB write already succeeded, and the
    // local tree.json is already updated for the next successful sync.
    console.error("[sync] git commit/push failed:", err);
  }
}
