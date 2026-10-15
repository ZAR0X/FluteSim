import { fingering, midiToFreq, midiToName, registerBlow, swarToSemitone } from './swar.js';

// Every JSON file in /songs is picked up automatically.
const files = import.meta.glob('../../songs/*.json', { eager: true, import: 'default' });

export const SONGS = Object.values(files)
  .filter((s) => s && Array.isArray(s.notes))
  .sort((a, b) => a.title.localeCompare(b.title));

export function prepareSong(song, saMidi) {
  const notes = song.notes
    .map((n) => {
      const semi = swarToSemitone(n);
      const midi = saMidi + semi;
      return {
        ...n,
        semi,
        holes: fingering(semi),
        blow: n.blow ?? registerBlow(semi),
        freq: midiToFreq(midi),
        sounding: midiToName(midi),
      };
    })
    .sort((a, b) => a.beat - b.beat);
  const [num] = song.timeSignature ?? [4, 4];
  const last = notes[notes.length - 1];
  const totalBeats = song.totalBeats ?? Math.ceil((last.beat + last.dur) / num) * num;
  return { ...song, notes, beatsPerBar: num, totalBeats };
}
