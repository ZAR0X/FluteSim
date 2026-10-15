// Quiet tabla motifs: drum-head rings and the laced straps (baddhi) with
// wooden blocks (gatta) along the top and bottom edges.

function Lacing({ flip }) {
  const id = flip ? 'lace-b' : 'lace-t';
  return (
    <svg className={`lacing ${flip ? 'bottom' : 'top'}`} aria-hidden="true">
      <defs>
        <pattern id={id} width="160" height="28" patternUnits="userSpaceOnUse">
          <path d="M0 0 L20 26 L40 0 L60 26 L80 0 L100 26 L120 0 L140 26 L160 0" className="lace" />
          <rect x="54" y="8" width="12" height="18" rx="4" className="gatta" />
        </pattern>
      </defs>
      <rect width="100%" height="28" fill={`url(#${id})`} />
    </svg>
  );
}

function Drum({ cx, cy, r }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="ring rim" />
      <circle cx={cx} cy={cy} r={r * 0.9} className="ring" />
      <circle cx={cx} cy={cy} r={r * 0.82} className="ring thin" />
      <circle cx={cx} cy={cy} r={r * 0.42} className="syahi" />
      <circle cx={cx} cy={cy} r={r * 0.32} className="ring thin" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r}
            y1={cy + Math.sin(a) * r}
            x2={cx + Math.cos(a) * r * 1.12}
            y2={cy + Math.sin(a) * r * 1.12}
            className="ring thin"
          />
        );
      })}
    </g>
  );
}

export default function Backdrop() {
  return (
    <>
      <svg className="backdrop" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <Drum cx={90} cy={880} r={260} />
        <Drum cx={1530} cy={120} r={190} />
      </svg>
      <Lacing />
      <Lacing flip />
    </>
  );
}
