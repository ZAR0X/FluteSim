# FluteSim

**[Play it → zar0x.github.io/FluteSim](https://zar0x.github.io/FluteSim/)**

A free, open-source bansuri simulator for the browser. Pick a song, and the
fingering falls onto a bamboo flute: a block drops into every hole you close,
a breath column over the mouth hole shows how hard to blow, and the swar
name sits beside it. No sheet music needed.

- Sargam first (Sa Re Ga Ma Pa Dha Ni), with western note names in small print
- Choose your flute's scale (Sa = C, C#, D … B)
- Play, pause, jump bar by bar, slow down to 0.25×
- Drag the notes up or down (or scroll) to move through the song
- Loop any part: the loop button picks the current phrase, then drag its ends on the timeline
- A synthesized flute voice that follows the song's blow strength and accents
- Songs are plain JSON files, and anyone can add one with a pull request

## Run it

```bash
npm install
```

```bash
npm run dev
```

Keyboard: `Space` play / pause · `←` `→` previous / next bar · `↑` `↓` speed

## Reading the screen

| You see | Meaning |
| --- | --- |
| block in a hole's column | close that hole for as long as the block lasts |
| striped block | half-cover that hole |
| ● filled hole on the flute | closed right now |
| ○ empty hole | open |
| dot under a swar | mandra (lower octave) |
| dot over a swar | taar (upper octave) |
| underlined swar | komal |
| column over the mouth hole | blowing; wider = stronger (narrow soft, wide = overblow) |
| arcs at the mouth hole | blow strength right now: 1 soft · 2 medium · 3 strong |
| gap in the columns | rest |
| darker bottom edge on a block | stress / accent |
| wind mark | breathe here |

Holes are counted from the mouthpiece side. On a standard 6-hole bansuri the
top three holes are covered by the left hand (for a right-side player) and
the lower three by the right hand.

## Add a song

No git? [Request a song](https://github.com/ZAR0X/FluteSim/issues/new?template=song-request.yml)
or [paste a song file](https://github.com/ZAR0X/FluteSim/issues/new?template=song-submission.yml)
in an issue and we'll add it. Every merge to `main` goes live on the site automatically.

With git:

1. Open [`docs/SONG_PROMPT.md`](docs/SONG_PROMPT.md), copy the prompt into any
   AI tool and fill in your song.
2. Save the JSON it returns as `songs/<id>.json`.
3. Run `npm run validate`, then `npm run dev`, and play it to check it.
4. Open a pull request. Once it's merged, the song shows up in the app.

Details are in [CONTRIBUTING.md](CONTRIBUTING.md). The file format is
described in [`schema/song.schema.json`](schema/song.schema.json).

## Songs

| Song | Composer | Level |
| --- | --- | --- |
| Alankar 1 — Sargam | Traditional | easy |
| Alankar 2 — Three steps | Traditional | easy |
| Alankar 3 — Four steps | Traditional | easy |
| Raag Yaman — Aaroh, avaroh, pakad | Traditional | medium |
| Raag Bhupali — Aaroh, avaroh, pakad | Traditional | easy |
| Ode to Joy | Ludwig van Beethoven | easy |
| Twinkle Twinkle Little Star | Traditional | easy |
| Happy Birthday | Mildred J. Hill & Patty Hill | easy |
| Enchanting Flute — Krishna Aur Kans | Shantanu Moitra | medium |
| Outer Wilds — Main Theme | Andrew Prahlow | easy |

## Roadmap

FluteSim is the first in a series of instrument simulators:

- [x] Bansuri (6-hole)
- [ ] 7-hole bansuri and western flute
- [ ] Acoustic guitar
- [ ] Electric guitar
- [ ] More instruments: harmonium, tabla, ukulele…

## Credits and song rights

Song notes are AI-assisted transcriptions, inspired by the original recordings
and shared for learning. We don't own the music; melodies belong to their
composers. If you hold the rights to a song here and want it removed, email
gourram790@gmail.com and it will be taken down.

The Outer Wilds melody follows the banjo part of
[Tristan Mailhot's MuseScore arrangement](https://musescore.com/user/35605948/scores/10315234),
cross-checked with the [EasyMusicLesson flute tutorial](https://www.youtube.com/watch?v=uoUTqe16dNY).

## License

Code: [MIT](LICENSE). Made by [Ram Gour](https://zarox.is-a.dev).
