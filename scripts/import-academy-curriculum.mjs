/**
 * Restore per-course curriculum into academy_curriculum_cache.
 *
 * Source: WPLMS app endpoint `POST /wp-json/wplms/v2/Course/{id}` on ceducap.academy,
 * which returns data.curriculum (sections/units/quizzes) WITHOUT auth — bypassing the
 * expired ACADEMY_SECRET JWT. Stores the shape that server/routes/courses.ts
 * normalizeCurriculum() expects.
 *
 * Usage:
 *   node scripts/import-academy-curriculum.mjs            # DRY RUN (no writes), samples 8
 *   node scripts/import-academy-curriculum.mjs --write    # full run, upsert into Supabase
 *   node scripts/import-academy-curriculum.mjs --write --limit 20   # cap for testing
 *
 * Reads DB_URL + course list from Supabase. Idempotent: upserts on academy_id.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const MISSING_ONLY = process.argv.includes("--missing-only"); // only courses not yet in curriculum cache
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;
const SITE = process.env.ACADEMY_SITE_URL || "https://www.ceducap.academy";
const CONCURRENCY = 6;

function loadDbUrl() {
  const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  const m = env.match(/^DB_URL=(.+)$/m);
  if (!m) throw new Error("DB_URL not found in .env");
  return m[1].trim().replace(/^["']|["']$/g, "");
}

async function fetchCurriculum(academyId, attempt = 0) {
  try {
    const res = await fetch(`${SITE}/wp-json/wplms/v2/Course/${academyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "ceduverse-importer/1.0" },
      body: JSON.stringify({ id: academyId }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const data = (Array.isArray(j) ? j[0] : j)?.data;
    if (!data) return null;
    const items = Array.isArray(data.curriculum) ? data.curriculum : [];
    return { data, items };
  } catch (e) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      return fetchCurriculum(academyId, attempt + 1);
    }
    throw e;
  }
}

const cleanBullet = (s) =>
  s.replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .split(/\s+(?:Habilidades|Competencias)\s*:/i)[0] // drop trailing "Habilidades: ..." tail
    .replace(/\s+/g, " ")
    .trim();

// Fallback when WPLMS has no real curriculum (curriculum:false): extract the real
// bullet/list topics from the program description if present, else surface the prose
// as a single labeled overview. Never fabricates "Unidad 1/2/3".
function buildFallbackJson(academyId, title, text) {
  if (!text || !text.trim()) return null;
  let items = [...text.matchAll(/<li[^>]*>(.*?)<\/li>/gis)].map((m) => cleanBullet(m[1])).filter((s) => s.length > 3);
  if (items.length < 2) {
    const plain = text.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const parts = plain.split(/\s*[•●·▪]\s*/).map((s) => cleanBullet(s)).filter((s) => s.length > 3);
    // drop a leading "Viñetas (debajo del resumen):" type preamble
    if (parts.length >= 3) items = parts.filter((p, i) => !(i === 0 && /vi[ñn]etas|debajo del resumen|^\d\)/i.test(p)));
  }
  if (items.length >= 2) {
    const curriculum = [
      { type: "section", title: "Contenido del programa", id: 0, unit_type: "section", duration: "", index: 0 },
      ...items.map((t, i) => ({ type: "unit", title: t, id: null, unit_type: "unit", duration: "", index: i + 1 })),
    ];
    return { course: { id: academyId, title: title || "" }, total_items: curriculum.length, curriculum, fallback: "bullets" };
  }
  // prose with no list structure → single overview item carrying the description
  const overview = text.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  if (overview.length < 40) return null;
  const curriculum = [
    { type: "unit", title: "Descripción del programa", id: null, unit_type: "unit", duration: "", index: 0, content: overview },
  ];
  return { course: { id: academyId, title: title || "" }, total_items: 1, curriculum, fallback: "overview" };
}

function buildJson(academyId, title, items) {
  const curriculum = items.map((it, idx) => ({
    type: it.type || "unit",
    title: it.title || `Lección ${idx + 1}`,
    id: it.id ?? it.ID ?? null,
    unit_type: it.type || "unit",
    duration: it.duration != null ? String(it.duration) : "",
    index: idx,
  }));
  return {
    course: { id: academyId, title: title || "" },
    total_items: curriculum.length,
    curriculum,
  };
}

async function mapPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

async function main() {
  console.log(`[curriculum] mode: ${WRITE ? "WRITE" : "DRY RUN"} | source: ${SITE} | concurrency: ${CONCURRENCY}`);
  const { Pool } = pg;
  const pool = new Pool({ connectionString: loadDbUrl(), connectionTimeoutMillis: 15000 });

  let courses;
  try {
    const where = MISSING_ONLY
      ? "WHERE status='publish' AND academy_id NOT IN (SELECT academy_id FROM academy_curriculum_cache)"
      : "WHERE status='publish'";
    const { rows } = await pool.query(
      `SELECT academy_id, title, content FROM academy_courses_cache ${where} ORDER BY academy_id`,
    );
    courses = rows.slice(0, LIMIT);
  } catch (e) {
    await pool.end();
    throw e;
  }
  console.log(`[curriculum] ${courses.length} courses to process`);

  let done = 0, ok = 0, empty = 0, fail = 0, totalItems = 0, fallbackUsed = 0;
  const failures = [];

  await mapPool(courses, async (c) => {
    let result = null;
    try {
      const r = await fetchCurriculum(c.academy_id);
      let json = r && r.items.length > 0 ? buildJson(c.academy_id, c.title, r.items) : null;
      if (!json) {
        // fallback: prefer WPLMS data.description, else the cached content
        const text = (r && r.data && r.data.description) || c.content || "";
        json = buildFallbackJson(c.academy_id, c.title, text);
        if (json) fallbackUsed++;
      }
      if (!json) { empty++; }
      else {
        totalItems += json.total_items;
        if (WRITE) {
          await pool.query(
            `INSERT INTO academy_curriculum_cache (academy_id, curriculum_json, total_items, synced_at)
             VALUES ($1,$2,$3, now())
             ON CONFLICT (academy_id) DO UPDATE SET
               curriculum_json=EXCLUDED.curriculum_json, total_items=EXCLUDED.total_items, synced_at=now()`,
            [c.academy_id, JSON.stringify(json), json.total_items],
          );
        }
        ok++;
        result = json;
      }
    } catch (e) {
      fail++;
      failures.push({ id: c.academy_id, err: e.message });
    }
    done++;
    if (done % 25 === 0 || done === courses.length) {
      process.stdout.write(`\r[curriculum] ${done}/${courses.length} | ok=${ok} empty=${empty} fail=${fail}`);
    }
    return result;
  }, CONCURRENCY);

  process.stdout.write("\n");
  console.log(`[curriculum] complete. ok=${ok} (incl. ${fallbackUsed} via description fallback) empty=${empty} fail=${fail} | total curriculum items=${totalItems}`);
  if (failures.length) console.log(`[curriculum] sample failures:`, JSON.stringify(failures.slice(0, 8)));

  if (!WRITE) {
    // show one sample
    const sample = courses.find((c) => c);
    if (sample) {
      const r = await fetchCurriculum(sample.academy_id).catch(() => null);
      if (r) console.log(`\n[curriculum] DRY RUN sample (#${sample.academy_id} "${sample.title?.slice(0,40)}"):\n`,
        JSON.stringify(buildJson(sample.academy_id, sample.title, r.items), null, 2).slice(0, 900));
    }
    console.log("\n[curriculum] DRY RUN — no rows written. Re-run with --write.");
  } else {
    const { rows } = await pool.query("SELECT count(*)::int AS total FROM academy_curriculum_cache");
    console.log(`[curriculum] academy_curriculum_cache now: ${rows[0].total} rows`);
  }
  await pool.end();
}

main().catch((e) => { console.error("[curriculum] FATAL:", e.message); process.exit(1); });
