# Prompt for generating a song file

Copy everything inside the box below into your AI tool (ChatGPT, Claude, Gemini, …).
Replace the two lines at the top with your song, and attach or paste any sheet music,
tabs or note lists you have. AI tools cannot listen to audio, so a written source
gives much better results than a YouTube link alone.

After you get the JSON:

1. Save it as `songs/<id>.json`, where `<id>` is the `id` field.
2. Run `npm run validate` and fix anything it reports.
3. Run `npm run dev`, play it with the sim and compare it with the original recording.
4. Open a pull request.

---

````text
SONG: <song title> — <composer / artist>
SOURCE: <link to the recording or tutorial, plus any sheet music / note list you have>

You are transcribing a melody for FluteSim, an open-source 6-hole bansuri
(Indian bamboo flute) simulator. Output ONE JSON file and nothing else.

## How the flute works
- Notes are written in sargam: Sa Re Ga Ma Pa Dha Ni.
- Playable range on a 6-hole bansuri: mandra Pa (lowest, all holes closed)
  up to taar Pa. Nothing lower than mandra Pa is possible.
  - mandra octave: Pa, Dha, Ni only
  - madhya octave: Sa Re Ga Ma Pa Dha Ni
  - taar octave: Sa Re Ga Ma Pa
- Shuddh (natural) notes are easiest. Komal Re/Ga/Dha/Ni and tivra Ma need
  half-holing, so prefer a choice of Sa that keeps notes shuddh.

## Step 1 — get the melody right
1. Work out the main melody (not chords or bass) from the source, with its
   time signature and tempo (BPM).
2. Write it bar by bar as western pitches with durations in beats. Check that
   every bar adds up to the beats in the time signature (rests included).
3. Pick the western pitch that becomes Sa: the note the song feels "at home"
   on, usually the key note of the key signature (D major → D = Sa). Check by
   singing the first phrase in sargam; if it starts on an odd swar like Ma,
   you have probably picked the wrong Sa. For a minor-key song, either use its relative major
   or map the tonic to Sa and use komal Ga/Dha/Ni.
4. Convert each pitch to swar + octave. If a note falls below mandra Pa or
   above taar Pa, move it by an octave and add "octaveShift": 1 or -1.

## Step 2 — write the JSON
{
  "schemaVersion": 1,
  "id": "kebab-case-title",                // also the file name
  "title": "Song Title",
  "composer": "Composer or artist",
  "from": "Film / game / album (optional)",
  "arrangement": {
    "by": "your name or handle",
    "reference": "link you used",
    "notes": "one or two sentences on any changes you made"
  },
  "instrument": "bansuri",
  "holes": 6,
  "tempo": 92,                             // beats per minute
  "timeSignature": [4, 4],
  "sourceKey": "A major",
  "saInSource": "A4",                      // which western pitch is Sa
  "recommendedScale": "C",                 // any of C C# D D# E F F# G G# A A# B
  "difficulty": "easy",                    // easy | medium | hard
  "totalBeats": 208,                       // bars × beats per bar
  "sections": [ { "name": "Intro", "bar": 1 } ],
  "notes": [
    {"bar":1,"beat":0,"dur":0.5,"swar":"Sa","octave":"madhya","western":"A4","blow":"medium","stress":0.85,"articulation":"tongued"}
  ]
}

Rules for each note (one note per line in the notes array):
- "beat": start time in beats from the start of the song (first beat = 0).
  Bar n starts at (n - 1) × beats per bar.
- "dur": length in beats. quarter = 1, eighth = 0.5, sixteenth = 0.25,
  dotted eighth = 0.75, half = 2, dotted half = 3.
- Rests are NOT notes. Leave a gap: the next note simply starts later.
- Tied notes become ONE note with the combined duration.
- Notes must be in time order and must not overlap.
- "swar": Sa | Re | Ga | Ma | Pa | Dha | Ni
- "variant": add "komal" (Re Ga Dha Ni) or "tivra" (Ma only). Omit for shuddh.
- "octave": mandra | madhya | taar
- "western": the original pitch, e.g. "C#5".
- "blow": soft for mandra notes, medium for madhya Sa–Ma, strong for madhya
  Pa and above (those are overblown).
- "stress": 0–1. Bar downbeat ≈ 0.85, beat 3 in 4/4 ≈ 0.65, other beats ≈ 0.5,
  off-beats ≈ 0.35, long held notes ≥ 0.7.
- "articulation": "tongued" for a fresh attack, "slurred" when the note
  joins the previous one without re-tonguing.
- "breathAfter": true where a player should breathe — at rests and at the
  ends of phrases (roughly every 2–4 bars). Never in the middle of a fast run.

Before answering, check again: every bar adds up, no overlaps, every note
is inside mandra Pa … taar Pa, and the melody matches the source.
Output only the JSON.
````
