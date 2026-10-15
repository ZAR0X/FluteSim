import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronsLeft,
  ChevronsRight,
  ListMusic,
  Minus,
  Pause,
  Play,
  Plus,
  Repeat,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Backdrop from './components/Backdrop.jsx';
import Corner from './components/Corner.jsx';
import Flute from './components/Flute.jsx';
import NoteLane, { SwarLabel } from './components/NoteLane.jsx';
import Sheet from './components/Sheet.jsx';
import { DEFAULT_SONG } from './config.js';
import { Player } from './lib/audio.js';
import { prepareSong, SONGS } from './lib/songs.js';
import { SCALES } from './lib/swar.js';

const SPEEDS = [0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1, 1.25, 1.5];

function fmt(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function usePopover() {
  const [open, setOpen] = useState(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!e.target.closest('.pop, .pop-trigger')) setOpen(null);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [open]);
  return [open, setOpen];
}

export default function App() {
  const [songId, setSongId] = useState(() => (SONGS.some((s) => s.id === DEFAULT_SONG) ? DEFAULT_SONG : SONGS[0]?.id));
  const raw = SONGS.find((s) => s.id === songId) ?? SONGS[0];
  const [scale, setScaleState] = useState(() => {
    try {
      return localStorage.getItem('flutesim.scale') || raw?.recommendedScale || 'C';
    } catch {
      return raw?.recommendedScale || 'C';
    }
  });
  const setScale = (v) => {
    setScaleState(v);
    try {
      localStorage.setItem('flutesim.scale', v);
    } catch {
      // storage unavailable; the choice just won't be remembered
    }
  };
  const saMidi = SCALES.find((s) => s.name === scale)?.saMidi ?? 72;
  const song = useMemo(() => prepareSong(raw, saMidi), [raw, saMidi]);

  const playerRef = useRef(null);
  if (!playerRef.current) playerRef.current = new Player();
  const player = playerRef.current;

  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [pop, setPop] = usePopover();
  const [sheet, setSheet] = useState(null);
  const closeSheet = useCallback(() => setSheet(null), []);

  const lead = song.beatsPerBar;

  useEffect(() => {
    player.load(song.notes, song.tempo, song.totalBeats, player.beat());
    setNow(player.beat());
  }, [song, player]);

  useEffect(() => {
    player.onEnd = () => setPlaying(false);
  }, [player]);

  useEffect(() => {
    if (!playing) return;
    let raf;
    const tick = () => {
      setNow(player.beat());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, player]);

  const toggle = useCallback(async () => {
    if (player.playing) {
      player.pause();
      setPlaying(false);
      setNow(player.beat());
      return;
    }
    const b = player.beat();
    if (!player.loop && (b <= 0 || b >= song.totalBeats)) player.seek(-lead);
    await player.play();
    setPlaying(true);
  }, [player, song.totalBeats, lead]);

  const seek = useCallback(
    (b) => {
      const clamped = Math.min(Math.max(b, 0), song.totalBeats);
      player.seek(clamped);
      setNow(clamped);
    },
    [player, song.totalBeats],
  );

  const jumpBar = useCallback(
    (dir) => {
      const bpb = song.beatsPerBar;
      const cur = Math.max(0, player.beat());
      const bar = Math.floor(cur / bpb + 1e-6);
      const into = cur - bar * bpb;
      const target = dir < 0 ? (into > 0.6 ? bar : bar - 1) : bar + 1;
      seek(target * bpb);
    },
    [player, seek, song.beatsPerBar],
  );

  const changeSpeed = useCallback(
    (dir) => {
      const i = SPEEDS.indexOf(speed);
      const next = SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, i + dir))];
      player.setSpeed(next);
      setSpeed(next);
      if (!player.playing) setNow(player.beat());
    },
    [player, speed],
  );


  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, select, textarea')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowLeft') jumpBar(-1);
      else if (e.key === 'ArrowRight') jumpBar(1);
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        changeSpeed(1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        changeSpeed(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, jumpBar, changeSpeed]);

  useEffect(() => {
    player.setMuted(muted);
  }, [muted, player]);

  // Stage geometry
  const stageRef = useRef(null);
  const [stageH, setStageH] = useState(600);
  const [stageW, setStageW] = useState(1000);
  useLayoutEffect(() => {
    const el = stageRef.current;
    const ro = new ResizeObserver(() => {
      setStageH(el.clientHeight);
      setStageW(el.clientWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const centerY = stageH / 2;
  const ppb = Math.min(84, Math.max(46, stageH / 9));
  const fluteW = Math.min(1000, stageW * 1.3);

  // Drag (or scroll) the roll up and down to move through the song.
  const drag = useRef(null);
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { y: e.clientY, beat: Math.max(0, player.beat()), resume: player.playing, moved: false };
    if (player.playing) {
      player.pause();
      setPlaying(false);
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (Math.abs(dy) > 3) d.moved = true;
    seek(d.beat + dy / ppb);
  };
  const onPointerUp = async () => {
    const d = drag.current;
    drag.current = null;
    if (d?.resume) {
      await player.play();
      setPlaying(true);
    }
  };
  const onWheel = (e) => {
    seek(Math.max(0, player.beat()) - e.deltaY / ppb);
  };

  // A-B loop, snapped to bars. Starts as the section around the playhead.
  const [loop, setLoop] = useState(null);
  useEffect(() => {
    player.setLoop(loop);
    setNow(player.beat());
  }, [loop, player]);
  useEffect(() => setLoop(null), [song.id]);
  const toggleLoop = () => {
    if (loop) return setLoop(null);
    const bpb = song.beatsPerBar;
    const bar = Math.floor(Math.max(0, now) / bpb) + 1;
    const secs = song.sections ?? [];
    let s0 = 1;
    let s1 = Math.round(song.totalBeats / bpb) + 1;
    for (const s of secs) {
      if (s.bar <= bar) s0 = s.bar;
      else {
        s1 = s.bar;
        break;
      }
    }
    if (s1 - s0 > 8 || !secs.length) {
      s0 = Math.floor((bar - 1) / 4) * 4 + 1;
      s1 = s0 + 4;
    }
    setLoop({ start: (s0 - 1) * bpb, end: Math.min(song.totalBeats, (s1 - 1) * bpb) });
  };
  const trackRef = useRef(null);
  const dragHandle = (which) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = trackRef.current.getBoundingClientRect();
    const bpb = song.beatsPerBar;
    const move = (ev) => {
      const f = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
      const b = Math.round((f * song.totalBeats) / bpb) * bpb;
      setLoop((l) => {
        if (!l) return l;
        if (which === 'start') return { ...l, start: Math.min(b, l.end - bpb) };
        return { ...l, end: Math.max(b, l.start + bpb) };
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const idx = song.notes.findIndex((n) => n.beat + n.dur > now);
  const cur = idx >= 0 && song.notes[idx].beat <= now ? song.notes[idx] : null;
  const shown = cur ?? (idx >= 0 ? song.notes[idx] : null);

  const secPerBeat = 60 / song.tempo / speed;
  const progress = Math.max(0, Math.min(1, now / song.totalBeats));

  return (
    <div className="app">
      <Backdrop />

      <header className="top">
        <div className="title">
          <span className="name">{song.title}</span>
          <span className="by">{song.composer}</span>
        </div>
        <div className="tools">
          <div className="anchor">
            <button className="icon pop-trigger key" onClick={() => setPop(pop === 'scale' ? null : 'scale')} title="Flute scale">
              <span className="sa">Sa</span>
              {scale}
            </button>
            {pop === 'scale' && (
              <div className="pop grid">
                {SCALES.map((s) => (
                  <button
                    key={s.name}
                    className={s.name === scale ? 'on' : undefined}
                    onClick={() => {
                      setScale(s.name);
                      setPop(null);
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="anchor">
            <button className="icon pop-trigger" onClick={() => setPop(pop === 'songs' ? null : 'songs')} title="Songs">
              <ListMusic size={18} strokeWidth={1.6} />
            </button>
            {pop === 'songs' && (
              <div className="pop list">
                {SONGS.map((s) => (
                  <button
                    key={s.id}
                    className={s.id === song.id ? 'on' : undefined}
                    onClick={() => {
                      player.pause();
                      setPlaying(false);
                      player.seek(0);
                      setSongId(s.id);
                      setPop(null);
                    }}
                  >
                    <span>{s.title}</span>
                    <small>{s.composer}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="icon" title="Add a song" onClick={() => setSheet('add')}>
            <Plus size={18} strokeWidth={1.6} />
          </button>
        </div>
      </header>

      <main
        className="stage"
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <NoteLane
          notes={song.notes}
          now={now}
          centerY={centerY}
          ppb={ppb}
          height={stageH}
          width={stageW}
          fluteW={fluteW}
          loop={loop}
          beatsPerBar={song.beatsPerBar}
          totalBeats={song.totalBeats}
        />
        <div className="flute-wrap" style={{ top: centerY, width: fluteW }}>
          <Flute holes={shown?.holes} blow={cur?.blow} sounding={!!cur && playing} />
        </div>
        <div className={`now${cur ? '' : ' idle'}`} style={{ top: centerY }}>
          {shown && (
            <>
              <SwarLabel note={shown} />
              <span className="west">{shown.sounding}</span>
            </>
          )}
        </div>
        {now < 0 && <div className="count" style={{ top: centerY - 80 }}>{Math.ceil(-now)}</div>}
      </main>

      <footer className="controls">
        <div className="timeline">
          <span className="time">{fmt(Math.max(0, now) * secPerBeat)}</span>
          <div className="track" ref={trackRef}>
            <div className="fill" style={{ width: `${progress * 100}%` }} />
            {loop && (
              <>
                <div
                  className="loop-range"
                  style={{
                    left: `${(loop.start / song.totalBeats) * 100}%`,
                    width: `${((loop.end - loop.start) / song.totalBeats) * 100}%`,
                  }}
                />
                <button
                  className="loop-handle"
                  style={{ left: `${(loop.start / song.totalBeats) * 100}%` }}
                  onPointerDown={dragHandle('start')}
                  aria-label="Loop start"
                />
                <button
                  className="loop-handle"
                  style={{ left: `${(loop.end / song.totalBeats) * 100}%` }}
                  onPointerDown={dragHandle('end')}
                  aria-label="Loop end"
                />
              </>
            )}
            {song.sections?.map((s) => (
              <i
                key={s.bar}
                className="mark"
                title={s.name}
                style={{ left: `${(((s.bar - 1) * song.beatsPerBar) / song.totalBeats) * 100}%` }}
              />
            ))}
            <input
              type="range"
              min={0}
              max={song.totalBeats}
              step={0.25}
              value={Math.max(0, now)}
              onChange={(e) => seek(+e.target.value)}
              aria-label="Seek"
            />
          </div>
          <span className="time">{fmt(song.totalBeats * secPerBeat)}</span>
        </div>

        <div className="buttons">
          <div className="group">
            <button className="icon" onClick={() => setMuted((m) => !m)} title={muted ? 'Unmute' : 'Mute'}>
              {muted ? <VolumeX size={18} strokeWidth={1.6} /> : <Volume2 size={18} strokeWidth={1.6} />}
            </button>
          </div>
          <div className="group main">
            <button className={`icon${loop ? ' on' : ''}`} onClick={toggleLoop} title={loop ? 'Stop looping' : 'Loop this part'}>
              <Repeat size={17} strokeWidth={1.6} />
            </button>
            <button className="icon" onClick={() => jumpBar(-1)} title="Previous bar">
              <ChevronsLeft size={20} strokeWidth={1.6} />
            </button>
            <button className="play" onClick={toggle} title={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause size={22} strokeWidth={1.8} /> : <Play size={22} strokeWidth={1.8} />}
            </button>
            <button className="icon" onClick={() => jumpBar(1)} title="Next bar">
              <ChevronsRight size={20} strokeWidth={1.6} />
            </button>
          </div>
          <div className="group speed">
            <button className="icon" onClick={() => changeSpeed(-1)} title="Slower">
              <Minus size={15} strokeWidth={1.8} />
            </button>
            <span className="rate">{speed}×</span>
            <button className="icon" onClick={() => changeSpeed(1)} title="Faster">
              <Plus size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>
        <Corner onAbout={() => setSheet('about')} />
      </footer>

      {sheet && <Sheet view={sheet} onClose={closeSheet} />}
    </div>
  );
}
