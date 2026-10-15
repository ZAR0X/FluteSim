// Swar helpers for a 6-hole bansuri.
// Semitones are counted from madhya Sa (0). Holes are listed from the
// mouthpiece side: 1 = closed, 0 = open, 0.5 = half covered.

const SHUDDH = { Sa: 0, Re: 2, Ga: 4, Ma: 5, Pa: 7, Dha: 9, Ni: 11 };
const OCTAVE = { mandra: -1, madhya: 0, taar: 1 };

export const SWARS = Object.keys(SHUDDH);
export const OCTAVES = Object.keys(OCTAVE);
export const VARIANTS = ['shuddh', 'komal', 'tivra'];
export const BLOWS = ['soft', 'medium', 'strong'];

export function swarToSemitone({ swar, octave = 'madhya', variant = 'shuddh' }) {
  let s = SHUDDH[swar];
  if (s === undefined) throw new Error(`Unknown swar "${swar}"`);
  if (variant === 'komal') s -= 1;
  if (variant === 'tivra') s += 1;
  return s + 12 * (OCTAVE[octave] ?? 0);
}

// One octave of fingerings, starting at Pa. The upper register reuses the
// same shapes with a stronger blow.
const SHAPES = {
  7: [1, 1, 1, 1, 1, 1], // Pa
  8: [1, 1, 1, 1, 1, 0.5], // komal Dha
  9: [1, 1, 1, 1, 1, 0], // Dha
  10: [1, 1, 1, 1, 0.5, 0], // komal Ni
  11: [1, 1, 1, 1, 0, 0], // Ni
  0: [1, 1, 1, 0, 0, 0], // Sa
  1: [1, 1, 0.5, 0, 0, 0], // komal Re
  2: [1, 1, 0, 0, 0, 0], // Re
  3: [1, 0.5, 0, 0, 0, 0], // komal Ga
  4: [1, 0, 0, 0, 0, 0], // Ga
  5: [0.5, 0, 0, 0, 0, 0], // Ma
  6: [0, 0, 0, 0, 0, 0], // tivra Ma
};

// Playable range: mandra Pa (-5) to taar Pa (19).
export const RANGE = [-5, 19];

export function fingering(semi) {
  if (semi === 19) return [0, 1, 1, 1, 1, 1];
  const pc = ((semi % 12) + 12) % 12;
  return SHAPES[pc];
}

export function registerBlow(semi) {
  if (semi < 0) return 'soft';
  if (semi < 7) return 'medium';
  return 'strong';
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Flute scale -> MIDI note of madhya Sa. Kept between A4 and G#5.
export const SCALES = NAMES.map((name, i) => ({ name, saMidi: i >= 9 ? 60 + i : 72 + i }));

export function midiToFreq(m) {
  return 440 * 2 ** ((m - 69) / 12);
}

export function midiToName(m) {
  return NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
}
