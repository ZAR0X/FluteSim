import { useEffect } from 'react';
import { BookOpen, FileJson, MessageSquarePlus, Wind, X } from 'lucide-react';
import { AUTHOR, EMAIL, LINKS, PORTFOLIO } from '../config.js';

const LEGEND = [
  ['blk', 'close'],
  ['blk half', 'half'],
  ['blk blow', 'blow'],
  ['dot down', 'mandra'],
  ['dot up', 'taar'],
  ['komal', 'komal'],
  ['breath', 'breathe'],
];

function Mark({ kind }) {
  if (kind === 'breath') return <Wind size={13} strokeWidth={1.6} />;
  if (kind === 'komal') return <span className="swar"><span className="komal">Ga</span></span>;
  if (kind.startsWith('dot'))
    return (
      <span className="swar">
        {kind === 'dot up' && <i className="dot up" />}
        <span>Sa</span>
        {kind === 'dot down' && <i className="dot down" />}
      </span>
    );
  return <i className={`mini ${kind}`} />;
}

function About() {
  return (
    <>
      <h2>FluteSim</h2>
      <p className="lede">Pick a song. Close the holes the blocks fall into.</p>

      <ul className="legend">
        {LEGEND.map(([kind, label]) => (
          <li key={label}>
            <span className="mark"><Mark kind={kind} /></span>
            {label}
          </li>
        ))}
      </ul>

      <div className="keys">
        <span><kbd>Space</kbd> play</span>
        <span><kbd>←</kbd><kbd>→</kbd> bar</span>
        <span><kbd>↑</kbd><kbd>↓</kbd> speed</span>
      </div>

      <p className="fine">
        Song notes are AI-assisted transcriptions, inspired by the originals and shared for learning. We don't own the
        music. Rights holder? <a href={`mailto:${EMAIL}?subject=FluteSim%20song%20removal`}>Email us</a> and we'll take
        it down.
      </p>

      <p className="made">
        Made by <a href={PORTFOLIO} target="_blank" rel="noreferrer">{AUTHOR}</a>
      </p>
    </>
  );
}

function AddSong() {
  return (
    <>
      <h2>Add a song</h2>
      <p className="lede">Merged songs go live on their own.</p>
      <div className="actions">
        <a className="pill wide" href={LINKS.request} target="_blank" rel="noreferrer">
          <MessageSquarePlus size={15} strokeWidth={1.7} /> Request
        </a>
        <a className="pill wide" href={LINKS.submit} target="_blank" rel="noreferrer">
          <FileJson size={15} strokeWidth={1.7} /> Submit
        </a>
        <a className="pill wide" href={LINKS.prompt} target="_blank" rel="noreferrer">
          <BookOpen size={15} strokeWidth={1.7} /> Guide
        </a>
      </div>
    </>
  );
}

export default function Sheet({ view, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="sheet-back" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={view === 'add' ? 'Add a song' : 'About'}>
        <button className="icon close" onClick={onClose} aria-label="Close">
          <X size={16} strokeWidth={1.7} />
        </button>
        {view === 'add' ? <AddSong /> : <About />}
      </div>
    </div>
  );
}
