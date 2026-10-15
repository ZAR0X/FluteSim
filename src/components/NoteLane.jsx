import { Wind } from 'lucide-react';
import { HOLE_R, HOLE_X, MOUTH_X } from './Flute.jsx';

const BLOW_WIDTH = { soft: 0.45, medium: 0.7, strong: 1 };

// Bhatkhande style: dot below = mandra, dot above = taar,
// underline = komal, tick above = tivra.
export function SwarLabel({ note, className = '' }) {
  return (
    <span className={`swar ${className}`}>
      {note.octave === 'taar' && <i className="dot up" />}
      {note.variant === 'tivra' && <i className="tivra" />}
      <span className={note.variant === 'komal' ? 'komal' : undefined}>{note.swar}</span>
      {note.octave === 'mandra' && <i className="dot down" />}
    </span>
  );
}

// Fingering roll: every note drops a block into each hole it closes,
// plus a breath column above the mouth hole whose width is the blow.
export default function NoteLane({ notes, now, centerY, ppb, height, width, fluteW, beatsPerBar, totalBeats, loop }) {
  const ahead = centerY / ppb + 1;
  const behind = (height - centerY) / ppb + 1;
  const visible = notes.filter((n) => n.beat < now + ahead && n.beat + n.dur > now - behind);

  const left = width / 2 - fluteW / 2;
  const sx = (x) => left + (x / 1000) * fluteW;
  const holeW = Math.max(14, (HOLE_R * 2 * fluteW) / 1000);
  const blockW = holeW * 1.15;
  const mouthW = blockW * 1.25;
  const labelX = sx(712);
  const y = (beat) => centerY - (beat - now) * ppb;

  const bars = [];
  const first = Math.max(0, Math.ceil((now - behind) / beatsPerBar));
  for (let b = first * beatsPerBar; b < now + ahead && b <= totalBeats; b += beatsPerBar) bars.push(b);

  return (
    <div className="lane">
      <div className="rails">
        {HOLE_X.map((x) => (
          <i key={x} style={{ left: sx(x) }} />
        ))}
        <i className="mouth-rail" style={{ left: sx(MOUTH_X) }} />
      </div>

      {loop && (
        <div
          className="loop-zone"
          style={{ top: y(loop.end), height: (loop.end - loop.start) * ppb, left: sx(MOUTH_X) - mouthW, width: sx(760) - sx(MOUTH_X) + mouthW }}
        />
      )}

      {bars.map((b) => (
        <div
          key={b}
          className="barline"
          style={{ transform: `translateY(${y(b)}px)`, left: sx(MOUTH_X) - mouthW / 2, width: sx(640) - sx(MOUTH_X) + mouthW }}
        >
          <span>{b / beatsPerBar + 1}</span>
        </div>
      ))}

      {visible.map((n) => {
        const top = y(n.beat + n.dur) + 2;
        const h = Math.max(n.dur * ppb - 4, 6);
        const state = now >= n.beat + n.dur ? 'past' : now >= n.beat ? 'active' : 'next';
        const bw = mouthW * (BLOW_WIDTH[n.blow] ?? 0.7);
        return (
          <div key={n.beat} className={`note ${state}`} style={{ '--stress': n.stress ?? 0.5 }}>
            <div className="blk blow" style={{ left: sx(MOUTH_X) - bw / 2, width: bw, top, height: h }} />
            {n.holes.map((v, i) =>
              v ? (
                <div
                  key={i}
                  className={`blk${v === 0.5 ? ' half' : ''}`}
                  style={{ left: sx(HOLE_X[i]) - blockW / 2, width: blockW, top, height: h }}
                />
              ) : null,
            )}
            <div className="label" style={{ left: labelX, top: top + h - 2 }}>
              <SwarLabel note={n} />
              <span className="west">{n.sounding}</span>
            </div>
            {n.breathAfter && (
              <Wind className="breath" size={13} strokeWidth={1.6} style={{ left: sx(MOUTH_X) + mouthW / 2 + 4, top: top - 14 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
