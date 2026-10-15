# Contributing a song

Every song is a single JSON file in [`songs/`](songs). The app loads every
file in that folder automatically, so you never need to edit any code.

## Steps

1. Fork the repo and create a branch.
2. Generate the file with the prompt in [`docs/SONG_PROMPT.md`](docs/SONG_PROMPT.md),
   or write it by hand using [`songs/outer-wilds-main-theme.json`](songs/outer-wilds-main-theme.json)
   as an example.
3. Save it as `songs/<id>.json`. The `id` field must match the file name.
4. Check it:

   ```bash
   npm run validate
   ```

5. Play it with `npm run dev` next to the original recording, at 0.5× and at 1×.
   Fix any wrong notes, timing or breath marks.
6. Open a pull request with:
   - the song title and composer,
   - the link you transcribed from,
   - what you checked by ear.

## What reviewers look for

- The melody matches the original recording.
- Every note fits a 6-hole bansuri (mandra Pa to taar Pa). Notes moved by an
  octave have `"octaveShift"`.
- Breath marks fall at rests and phrase ends.
- One note per line, so diffs stay readable.
- `npm run validate` passes. CI runs it on every pull request.

## Song format, in short

| Field | Example | Meaning |
| --- | --- | --- |
| `beat` | `12.5` | start, in beats from the start of the song |
| `dur` | `0.5` | length in beats (quarter = 1, eighth = 0.5) |
| `swar` | `"Ga"` | Sa Re Ga Ma Pa Dha Ni |
| `variant` | `"komal"` | komal / tivra; leave it out for shuddh |
| `octave` | `"madhya"` | mandra / madhya / taar |
| `western` | `"C#5"` | original pitch, shown in small print |
| `blow` | `"strong"` | soft / medium / strong |
| `stress` | `0.85` | accent, 0 to 1 |
| `articulation` | `"slurred"` | tongued / slurred |
| `breathAfter` | `true` | take a breath after this note |

Rests are gaps between notes. Tied notes are one note with the combined length.
