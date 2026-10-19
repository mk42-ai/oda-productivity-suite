#!/usr/bin/env node
/**
 * palette-audit.mjs — brand rule: Caribbean Green #0AC985 / sage / white / charcoal, ZERO blue.
 *   SOURCE mode (`--source`, or default when no build exists): scans the reputation route, shared styles and reputation libs for hex / rgb() /
 *     hsl() literals and Tailwind blue-family utilities (bg-blue-500, text-indigo-…, ring-sky-…, …).
 *   BUILD mode (`--build`, or default when .next/static/css exists): scans the stylesheets actually linked from the prerendered /reputation page
 *     (.next/server/app/reputation.html) plus every static chunk that mentions "reputation".
 * A colour is BLUE when its HSL hue is in [190, 260] with saturation > 0.15 and chroma > 0.15 — the same gate as src/lib/hue-audit.ts.
 * Output: one JSON line {mode, filesScanned, hits:[{file,line,value,hsl}], ok}; exit 0 when ok, 1 otherwise (the polish gate fails on blue).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function rgbToHsl(r, g, b) {
  const R = r / 255, G = g / 255, B = b / 255; const max = Math.max(R, G, B), min = Math.min(R, G, B); const l = (max + min) / 2;
  if (max === min) return [0, 0, l, 0];
  const d = max - min; const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h; if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) * 60; else if (max === G) h = ((B - R) / d + 2) * 60; else h = ((R - G) / d + 4) * 60;
  return [h, s, l, d];
}
function parseHex(raw) {
  let h = raw.slice(1); if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6); if (h.length !== 6) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function parseRgb(raw) {
  const m = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)/i.exec(raw.trim()); if (!m) return null;
  const v = (x) => (x.endsWith("%") ? (parseFloat(x) * 255) / 100 : parseFloat(x)); return [v(m[1]), v(m[2]), v(m[3])];
}
function parseHsl(raw) {
  const m = /^hsla?\(\s*([\d.]+)(deg|rad|turn)?[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?/i.exec(raw.trim()); if (!m) return null;
  let h = parseFloat(m[1]); if (m[2] === "rad") h = (h * 180) / Math.PI; if (m[2] === "turn") h *= 360;
  const s = parseFloat(m[3]) / 100, l = parseFloat(m[4]) / 100; const c = (1 - Math.abs(2 * l - 1)) * s; const x = c * (1 - Math.abs(((h / 60) % 2) - 1)); const mm = l - c / 2;
  let r, g, b; if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return [(r + mm) * 255, (g + mm) * 255, (b + mm) * 255];
}
function checkBlue(rgb) {
  if (!rgb) return null; const [h, s, l, d] = rgbToHsl(...rgb);
  return h >= 190 && h <= 260 && s > 0.15 && d > 0.15 ? [Math.round(h), +s.toFixed(3), +l.toFixed(3)] : null;
}
const HEX_RE = /(?<![0-9a-zA-Z_-])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g;
const RGB_RE = /\brgba?\(\s*[\d.]+%?[\s,]+[\d.]+%?[\s,]+[\d.]+%?(?:\s*[,/]\s*[\d.]+%?)?\s*\)/gi;
const HSL_RE = /\bhsla?\(\s*[\d.]+(?:deg|rad|turn)?[\s,]+[\d.]+%?[\s,]+[\d.]+%?(?:\s*[,/]\s*[\d.]+%?)?\s*\)/gi;
const TW_RE = /\b(?:bg|text|border|ring|outline|from|to|via|fill|stroke|accent|caret|decoration|shadow)-(?:blue|indigo|sky|cyan|violet)-\d{2,3}\b/g;
const DOC_COMMENT_RE = /no blue|never blue|zero blue|not blue|blue hue/i;
const TW_FAMILY_HSL = { blue: [217, 0.91, 0.6], indigo: [239, 0.84, 0.67], sky: [199, 0.89, 0.48], cyan: [189, 0.94, 0.43], violet: [258, 0.9, 0.66] };

function walkDir(dir, keep) {
  if (!fs.existsSync(dir)) return []; const st = fs.statSync(dir); if (st.isFile()) return keep(dir) ? [dir] : [];
  const out = []; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) out.push(...walkDir(p, keep)); else if (keep(p)) out.push(p); } return out;
}
function collectFiles(mode) {
  if (mode === "source") {
    const dirs = ["src/components/reputation", "src/app/reputation", "src/app/api/reputation", "src/lib/reputation", "src/styles", "src/app/globals.css"];
    return dirs.flatMap((d) => walkDir(path.join(ROOT, d), (f) => /\.(tsx?|css|mjs|js)$/.test(f) && !f.endsWith("src/lib/hue-audit.ts")));
  }
  let css = walkDir(path.join(ROOT, ".next/static/css"), (f) => f.endsWith(".css"));
  const page = path.join(ROOT, ".next/server/app/reputation.html");
  if (fs.existsSync(page)) { const linked = new Set([...fs.readFileSync(page, "utf8").matchAll(/\/_next\/static\/css\/([^"']+\.css)/g)].map((m) => m[1])); if (linked.size) css = css.filter((f) => linked.has(path.basename(f))); }
  const chunks = walkDir(path.join(ROOT, ".next/static/chunks"), (f) => f.endsWith(".js") && /reputation/i.test(fs.readFileSync(f, "utf8")));
  return [...css, ...chunks];
}
function run() {
  const args = process.argv.slice(2);
  const cssDir = path.join(ROOT, ".next/static/css");
  const hasCss = fs.existsSync(cssDir) && fs.readdirSync(cssDir).some((f) => f.endsWith(".css"));
  const mode = args.includes("--build") ? "build" : args.includes("--source") ? "source" : hasCss ? "build" : "source";
  const jsonArg = args.indexOf("--json"); const jsonPath = jsonArg !== -1 ? args[jsonArg + 1] : args.find((a) => a.startsWith("--json="))?.split("=")[1];
  const files = collectFiles(mode); const hits = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8"); const relFile = path.relative(ROOT, file);
    const getLine = (pos) => content.slice(0, pos).split("\n").length;
    const ignoredRanges = [], commentRanges = [];
    if (mode === "source") { const commRe = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g; let cm; while ((cm = commRe.exec(content)) !== null) { commentRanges.push([cm.index, cm.index + cm[0].length]); if (DOC_COMMENT_RE.test(cm[0])) ignoredRanges.push([cm.index, cm.index + cm[0].length]); } }
    const inComment = (pos) => commentRanges.some(([s, e]) => pos >= s && pos < e);
    // an all-digit "#258" inside a comment is an issue reference (react-force-graph #258), not a colour
    const isIgnored = (pos, value) => ignoredRanges.some(([s, e]) => pos >= s && pos < e) || (value !== undefined && /^#\d+$/.test(value) && inComment(pos));
    const isAllowListedBuild = (pos) => mode === "build" && (content.slice(Math.max(0, pos - 60), pos).includes("simple-icons") || content.slice(Math.max(0, pos - 60), pos).includes("hex:"));
    for (const [re, parser] of [[HEX_RE, parseHex], [RGB_RE, parseRgb], [HSL_RE, parseHsl]]) {
      for (const m of content.matchAll(re)) { if (isIgnored(m.index, m[0]) || isAllowListedBuild(m.index)) continue; const hsl = checkBlue(parser(m[0])); if (hsl) hits.push({ file: relFile, line: getLine(m.index), value: m[0], hsl }); }
    }
    if (mode === "source") for (const m of content.matchAll(TW_RE)) { if (isIgnored(m.index)) continue; const fam = m[0].match(/-(blue|indigo|sky|cyan|violet)-/)?.[1]; hits.push({ file: relFile, line: getLine(m.index), value: m[0], hsl: fam ? TW_FAMILY_HSL[fam] : null }); }
  }
  const out = { mode, filesScanned: files.length, hits, ok: hits.length === 0 };
  const line = JSON.stringify(out); console.log(line); if (jsonPath) fs.writeFileSync(jsonPath, line + "\n");
  process.exit(out.ok ? 0 : 1);
}
run();
