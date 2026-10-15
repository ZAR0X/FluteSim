// Horizontal bansuri. The finger-hole group is centred on x = 500 so the
// note lane (centred on the page) runs straight through the holes.

export const HOLE_X = [360, 416, 472, 528, 584, 640];
export const MOUTH_X = 150;
export const HOLE_R = 13.5;
const BLOW_RANK = { soft: 1, medium: 2, strong: 3 };

function Hole({ x, state }) {
  const id = `half-${x}`;
  return (
    <g>
      <circle cx={x} cy={60} r={16.5} className="hole-rim" />
      <circle cx={x} cy={60} r={13.5} className="hole-open" />
      <clipPath id={id}>
        <rect x={x - 14} y={60} width={28} height={15} />
      </clipPath>
      <circle cx={x} cy={60} r={13.5} className="hole-cover" style={{ opacity: state === 1 ? 1 : 0 }} />
      <circle
        cx={x}
        cy={60}
        r={13.5}
        className="hole-cover"
        clipPath={`url(#${id})`}
        style={{ opacity: state === 0.5 ? 1 : 0 }}
      />
    </g>
  );
}

export default function Flute({ holes, blow, sounding }) {
  const rank = sounding ? BLOW_RANK[blow] ?? 2 : 0;
  return (
    <svg className="flute" viewBox="0 0 1000 120" role="img" aria-label="Bansuri fingering">
      <defs>
        <linearGradient id="bamboo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9b48a" />
          <stop offset="0.35" stopColor="#c99a68" />
          <stop offset="0.75" stopColor="#a87346" />
          <stop offset="1" stopColor="#8a5a34" />
        </linearGradient>
        <linearGradient id="rope" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a2f22" />
          <stop offset="1" stopColor="#4f1d15" />
        </linearGradient>
      </defs>

      {/* blow arcs */}
      <g className="blow" transform={`translate(${MOUTH_X - 6} 26)`}>
        {[1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M ${-10 - i * 9} ${-4 - i * 5} Q ${-2} ${-14 - i * 6} ${8 + i * 9} ${-4 - i * 5}`}
            className={i <= rank ? 'arc on' : 'arc'}
          />
        ))}
      </g>

      <rect x="40" y="35" width="860" height="50" rx="25" fill="url(#bamboo)" />
      <rect x="40" y="37" width="860" height="10" rx="5" fill="#fff" opacity="0.18" />

      {/* nodes */}
      {[300, 700].map((x) => (
        <rect key={x} x={x} y="35" width="5" height="50" fill="#6b3f23" opacity="0.28" />
      ))}

      {/* silk bindings */}
      {[78, 96, 232, 252, 760, 780, 860, 878].map((x) => (
        <g key={x}>
          <rect x={x} y="34" width="11" height="52" rx="2" fill="url(#rope)" />
          <rect x={x + 3} y="34" width="2" height="52" fill="#c8a274" opacity="0.45" />
        </g>
      ))}

      {/* mouth hole */}
      <ellipse cx={MOUTH_X} cy="60" rx="13" ry="10" className="mouth" />

      {HOLE_X.map((x, i) => (
        <Hole key={x} x={x} state={holes?.[i] ?? 0} />
      ))}
    </svg>
  );
}
