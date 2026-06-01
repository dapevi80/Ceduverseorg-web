/**
 * Restore the academy course catalog into academy_courses_cache.
 *
 * Source: public WordPress REST API at ceducap.academy (post type `course`).
 * This bypasses the expired ACADEMY_SECRET JWT — the catalog is public.
 *
 * Usage:
 *   node scripts/import-academy-courses.mjs            # DRY RUN (no writes)
 *   node scripts/import-academy-courses.mjs --write    # upsert into Supabase
 *
 * Reads DB_URL from .env. Idempotent: upserts on academy_id.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const SITE = process.env.ACADEMY_SITE_URL || "https://www.ceducap.academy";
const PER_PAGE = 100;

function loadDbUrl() {
  const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  const m = env.match(/^DB_URL=(.+)$/m);
  if (!m) throw new Error("DB_URL not found in .env");
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const strip = (html) =>
  (html || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8230;/g, "…")
    .trim();

async function fetchPage(page) {
  const url = `${SITE}/wp-json/wp/v2/course?per_page=${PER_PAGE}&page=${page}&status=publish&_fields=id,date,modified,slug,status,link,title,excerpt,content,author`;
  const res = await fetch(url, { headers: { "User-Agent": "ceduverse-importer/1.0" } });
  if (!res.ok) throw new Error(`WP REST page ${page} -> HTTP ${res.status}`);
  const total = Number(res.headers.get("x-wp-total") || 0);
  const pages = Number(res.headers.get("x-wp-totalpages") || 0);
  const data = await res.json();
  return { data, total, pages };
}

function mapCourse(c) {
  return {
    academy_id: c.id,
    title: strip(c.title?.rendered) || `Curso ${c.id}`,
    excerpt: strip(c.excerpt?.rendered) || null,
    content: c.content?.rendered || null,
    status: c.status || "publish",
    url: c.link || null,
    date: c.date ? new Date(c.date).toISOString() : null,
    modified: c.modified ? new Date(c.modified).toISOString() : null,
    author_id: c.author != null ? String(c.author) : null,
  };
}

async function main() {
  console.log(`[import] mode: ${WRITE ? "WRITE" : "DRY RUN"} | source: ${SITE}`);
  const first = await fetchPage(1);
  console.log(`[import] WP reports total=${first.total} pages=${first.pages}`);

  const all = [...first.data];
  for (let p = 2; p <= first.pages; p++) {
    const { data } = await fetchPage(p);
    all.push(...data);
    process.stdout.write(`\r[import] fetched ${all.length}/${first.total}`);
  }
  process.stdout.write("\n");

  const mapped = all.map(mapCourse);
  console.log(`[import] mapped ${mapped.length} courses`);
  console.log("[import] sample:", JSON.stringify(
    { ...mapped[0], content: mapped[0]?.content ? `<${mapped[0].content.length} chars>` : null },
    null, 2,
  ));

  if (!WRITE) {
    console.log("\n[import] DRY RUN — no rows written. Re-run with --write to upsert.");
    return;
  }

  const { Pool } = pg;
  const pool = new Pool({ connectionString: loadDbUrl(), connectionTimeoutMillis: 15000 });
  let ok = 0, fail = 0;
  try {
    for (const c of mapped) {
      try {
        await pool.query(
          `INSERT INTO academy_courses_cache
             (academy_id, title, excerpt, content, status, url, date, modified, author_id, synced_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
           ON CONFLICT (academy_id) DO UPDATE SET
             title=EXCLUDED.title, excerpt=EXCLUDED.excerpt, content=EXCLUDED.content,
             status=EXCLUDED.status, url=EXCLUDED.url, date=EXCLUDED.date,
             modified=EXCLUDED.modified, author_id=EXCLUDED.author_id, synced_at=now()`,
          [c.academy_id, c.title, c.excerpt, c.content, c.status, c.url, c.date, c.modified, c.author_id],
        );
        ok++;
      } catch (e) {
        fail++;
        console.error(`\n[import] FAIL academy_id=${c.academy_id}: ${e.message}`);
      }
      if (ok % 100 === 0) process.stdout.write(`\r[import] upserted ${ok}`);
    }
    process.stdout.write("\n");
    const { rows } = await pool.query(
      "SELECT count(*)::int AS total, count(*) FILTER (WHERE status='publish')::int AS published FROM academy_courses_cache",
    );
    console.log(`[import] done. ok=${ok} fail=${fail} | cache now: ${JSON.stringify(rows[0])}`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error("[import] FATAL:", e.message); process.exit(1); });
