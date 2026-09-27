#!/usr/bin/env node
/**
 * Loads Napoleon Hill's *The Law of Success in Sixteen Lessons* (1928, public domain
 * in the U.S.) into the law_of_success_chunks table, so the Director AI can quote
 * the real text instead of paraphrasing from memory.
 *
 * 1. Convert the PDF to text:
 *      pdftotext -enc UTF-8 "Napoleon Hill - The Law of Success in Sixteen Lessons.pdf" law-of-success.txt
 * 2. Get an access token for an ADMIN user (e.g. from the browser session: supabase.auth.getSession()).
 * 3. Run:
 *      SUPABASE_URL=https://<project>.supabase.co \
 *      ADMIN_ACCESS_TOKEN=<jwt> \
 *      node scripts/ingest-law-of-success.mjs law-of-success.txt [--replace] [--dry-run]
 *
 * Use the 1928 original only. Modern editions (e.g. the 21st Century Edition)
 * add copyrighted commentary.
 */
import { readFileSync } from "node:fs";

const LESSON_WORDS = [
  "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
  "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
];
// Volumes of the original four-volume course.
const volumeFor = (lesson) => (lesson <= 0 ? 1 : lesson <= 4 ? 1 : lesson <= 8 ? 2 : lesson <= 12 ? 3 : 4);

const CHUNK_CHARS = 1800;
const OVERLAP_CHARS = 200;
const BATCH = 25;

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const replace = args.includes("--replace");
const dryRun = args.includes("--dry-run");

if (!file) {
  console.error("Usage: node scripts/ingest-law-of-success.mjs <law-of-success.txt> [--replace] [--dry-run]");
  process.exit(1);
}

const raw = readFileSync(file, "utf8");
const lines = raw.split(/\r?\n/);

// Split into lessons on the "Lesson One" ... "Lesson Sixteen" heading lines.
const sections = [];
let current = { lesson: 0, lesson_name: "Introduction", lines: [] };
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].trim().match(/^Lesson (\w+)$/);
  const idx = m ? LESSON_WORDS.indexOf(m[1]) : -1;
  if (idx >= 0 && idx + 1 === current.lesson + 1) {
    sections.push(current);
    // Lesson title is the next non-empty line(s) in capitals.
    let name = "";
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const t = lines[j].trim();
      if (!t) continue;
      if (/^[A-Z][A-Z &'\-]+$/.test(t)) name += (name ? " " : "") + t;
      else if (name) break;
    }
    current = { lesson: idx + 1, lesson_name: toTitle(name) || `Lesson ${m[1]}`, lines: [] };
    continue;
  }
  current.lines.push(lines[i]);
}
sections.push(current);

function toTitle(s) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\b(Of|And)\b/g, (w) => w.toLowerCase()).replace(/\bThe\b(?!^)/g, "the").replace(/^the/, "The");
}

function clean(text) {
  return text
    .replace(/^\s*-\s*\d+\s*-\s*$/gm, "") // page numbers like "- 119 -"
    .replace(/^\s*-\d+-\s*$/gm, "")
    .replace(/^\s*[·•]\s*$/gm, "")
    .replace(/-\n(?=[a-z])/g, "") // re-join hyphenated words
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function chunk(text) {
  const out = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_CHARS, text.length);
    if (end < text.length) {
      const stop = text.lastIndexOf(". ", end);
      if (stop > start + CHUNK_CHARS * 0.6) end = stop + 1;
    }
    out.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = Math.max(end - OVERLAP_CHARS, start + 1);
  }
  return out.filter((c) => c.length > 80);
}

const chunks = [];
for (const s of sections) {
  const pieces = chunk(clean(s.lines.join("\n")));
  pieces.forEach((content, i) =>
    chunks.push({ volume: volumeFor(s.lesson), lesson: s.lesson, lesson_name: s.lesson_name, chunk_index: i, content }),
  );
}

console.log(`Found ${sections.length} sections, ${chunks.length} chunks.`);
for (const s of sections) console.log(`  Lesson ${s.lesson}: ${s.lesson_name}`);
if (sections.length !== 17) console.warn("Expected 17 sections (introduction + 16 lessons). Check the text file.");
if (dryRun) process.exit(0);

const url = process.env.SUPABASE_URL;
const token = process.env.ADMIN_ACCESS_TOKEN;
if (!url || !token) {
  console.error("Set SUPABASE_URL and ADMIN_ACCESS_TOKEN.");
  process.exit(1);
}

async function post(body) {
  const res = await fetch(`${url}/functions/v1/ingest-law-of-success`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status}: ${json.error ?? "request failed"}`);
  return json;
}

if (replace) {
  await post({ replace: true, chunks: [] });
  console.log("Cleared existing chunks.");
}
let inserted = 0;
for (let i = 0; i < chunks.length; i += BATCH) {
  const r = await post({ chunks: chunks.slice(i, i + BATCH) });
  inserted += r.inserted;
  console.log(`Inserted ${inserted}/${chunks.length}`);
}
console.log("Done.");
