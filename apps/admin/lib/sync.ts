import { writeFile } from "fs/promises";
import path from "path";
// import { simpleGit } from "simple-git"; // وقفنا استدعاء مكتبة الجيت لأننا ما رح نستخدمها حالياً
import { fetchFullTree } from "./db";

/**
 * Regenerates apps/public/data/tree.json from the database and updates it locally.
 * Auto-push to git is DISABLED to prevent commit spam.
 */
export async function syncToPublicSite(): Promise<void> {
  const tree = await fetchFullTree();

  const repoPath = process.env.SITE_REPO_PATH;
  if (!repoPath) {
    console.warn("[sync] SITE_REPO_PATH is not set — skipping git sync (wrote tree.json locally only).");
    return;
  }

  const targetFile = path.join(repoPath, "apps", "public", "data", "tree.json");
  // 🌟 هذا السطر بيحفظ التعديلات على ملف JSON محلياً بنجاح
  await writeFile(targetFile, JSON.stringify(tree, null, 2), "utf-8");

  try {
    console.log("[sync] تم تحديث ملف tree.json محلياً بنجاح (الرفع التلقائي معطل).");
    
    // 🌟 تم تهميش (إيقاف) أوامر الرفع التلقائي لمنع زحمة الـ Commits
    /*
    const git = simpleGit(repoPath);
    await git.add("apps/public/data/tree.json");
    const status = await git.status();
    if (status.staged.length === 0) {
      return; 
    }
    await git.commit(`sync: update family tree data (${new Date().toISOString()})`);
    await git.push("origin", "main");
    console.log("[sync] Pushed updated tree.json — Netlify will redeploy shortly.");
    */
  } catch (err) {
    console.error("[sync] حدث خطأ أثناء محاولة التحديث:", err);
  }
}