// Validates every file in /songs. Runs in CI on pull requests and before builds.
// Usage: node scripts/validate-songs.mjs [file ...]
import fs from 'node:fs';
import path from 'node:path';

const SWARS = ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'];
const SHUDDH = { Sa: 0, Re: 2, Ga: 4, Ma: 5, Pa: 7, Dha: 9, Ni: 11 };
const OCTAVES = { mandra: -1, madhya: 0, taar: 1 };
const VARIANTS = ['shuddh', 'komal', 'tivra'];
const BLOWS = ['soft', 'medium', 'strong'];
const ARTICULATIONS = ['tongued', 'slurred'];
const RANGE = [-5, 19]; // mandra Pa .. taar Pa on a 6-hole bansuri
const EPS = 1e-6;

const dir = path.resolve(import.meta.dirname, '..', 'songs');
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f));

let failed = 0;
const ids = new Map();

for (const file of files) {
  const errors = [];
  const err = (m) => errors.push(m);
  let song;
  try {
    song = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`✗ ${path.basename(file)}\n  invalid JSON: ${e.message}`);
    failed++;
    continue;
  }

  const base = path.basename(file, '.json');
  if (song.schemaVersion !== 1) err('schemaVersion must be 1');
  if (typeof song.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(song.id)) err('id must be kebab-case');
  else if (song.id !== base) err(`id "${song.id}" must match the file name "${base}.json"`);
  if (ids.has(song.id)) err(`duplicate id, also used by ${ids.get(song.id)}`);
  ids.set(song.id, base);
  for (const k of ['title', 'composer']) if (typeof song[k] !== 'string' || !song[k].trim()) err(`${k} is required`);
  if (song.instrument !== 'bansuri') err('instrument must be "bansuri"');
  if (song.holes !== 6) err('holes must be 6');
  if (!(song.tempo >= 20 && song.tempo <= 300)) err('tempo must be between 20 and 300 (beats per minute)');
  const ts = song.timeSignature;
  if (!Array.isArray(ts) || ts.length !== 2 || !ts.every((n) => Number.isInteger(n) && n > 0)) err('timeSignature must be like [4, 4]');
  const bpb = Array.isArray(ts) ? ts[0] : 4;
  if (!Array.isArray(song.notes) || song.notes.length === 0) err('notes must be a non-empty array');

  let prevEnd = -Infinity;
  let prevBeat = -Infinity;
  (song.notes ?? []).forEach((n, i) => {
    const at = `notes[${i}]`;
    if (typeof n.beat !== 'number' || n.beat < 0) return err(`${at}.beat must be a number ≥ 0`);
    if (typeof n.dur !== 'number' || n.dur <= 0) return err(`${at}.dur must be a number > 0`);
    if (n.beat < prevBeat - EPS) err(`${at} is out of order (beat ${n.beat} after ${prevBeat})`);
    if (n.beat < prevEnd - EPS) err(`${at} overlaps the previous note (starts at ${n.beat}, previous ends at ${prevEnd})`);
    prevBeat = n.beat;
    prevEnd = n.beat + n.dur;
    if (!SWARS.includes(n.swar)) return err(`${at}.swar must be one of ${SWARS.join(', ')}`);
    if (!(n.octave in OCTAVES)) return err(`${at}.octave must be mandra, madhya or taar`);
    const variant = n.variant ?? 'shuddh';
    if (!VARIANTS.includes(variant)) err(`${at}.variant must be shuddh, komal or tivra`);
    if (variant === 'komal' && !['Re', 'Ga', 'Dha', 'Ni'].includes(n.swar)) err(`${at}: only Re, Ga, Dha, Ni can be komal`);
    if (variant === 'tivra' && n.swar !== 'Ma') err(`${at}: only Ma can be tivra`);
    const semi = SHUDDH[n.swar] + (variant === 'komal' ? -1 : variant === 'tivra' ? 1 : 0) + 12 * OCTAVES[n.octave];
    if (semi < RANGE[0] || semi > RANGE[1]) err(`${at}: ${n.octave} ${n.swar} is outside the bansuri range (mandra Pa to taar Pa)`);
    if (n.bar !== undefined && n.bar !== Math.floor(n.beat / bpb + EPS) + 1) err(`${at}.bar is ${n.bar} but beat ${n.beat} falls in bar ${Math.floor(n.beat / bpb + EPS) + 1}`);
    if (n.blow !== undefined && !BLOWS.includes(n.blow)) err(`${at}.blow must be soft, medium or strong`);
    if (n.stress !== undefined && !(n.stress >= 0 && n.stress <= 1)) err(`${at}.stress must be between 0 and 1`);
    if (n.articulation !== undefined && !ARTICULATIONS.includes(n.articulation)) err(`${at}.articulation must be tongued or slurred`);
    if (n.western !== undefined && !/^[A-G](#|b)?\d$/.test(n.western)) err(`${at}.western must look like "C#5"`);
  });

  if (song.totalBeats !== undefined && song.totalBeats < prevEnd - EPS) err(`totalBeats (${song.totalBeats}) is shorter than the last note end (${prevEnd})`);

  if (errors.length) {
    failed++;
    console.error(`✗ ${path.basename(file)}`);
    for (const e of errors.slice(0, 30)) console.error(`  ${e}`);
    if (errors.length > 30) console.error(`  …and ${errors.length - 30} more`);
  } else {
    console.log(`✓ ${path.basename(file)}  (${song.notes.length} notes)`);
  }
}

if (failed) {
  console.error(`\n${failed} song file(s) failed validation`);
  process.exit(1);
}
