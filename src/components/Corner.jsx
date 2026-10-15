import { useState } from 'react';
import { Check, Info, Mail, Share2 } from 'lucide-react';
import { EMAIL, REPO } from '../config.js';

export function GithubIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

// Small icon-only pills in the bottom-right corner.
export default function Corner({ onAbout }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href.split('#')[0];
    const data = { title: 'FluteSim', text: 'A free bansuri simulator for the browser', url };
    try {
      if (navigator.share) return await navigator.share(data);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // share sheet dismissed or clipboard blocked
    }
  };

  return (
    <nav className="corner" aria-label="About and links">
      <button className="pill" onClick={onAbout} title="About" aria-label="About">
        <Info size={15} strokeWidth={1.7} />
      </button>
      <a className="pill" href={`mailto:${EMAIL}?subject=FluteSim`} title="Contact" aria-label="Contact">
        <Mail size={15} strokeWidth={1.7} />
      </a>
      <a className="pill" href={REPO} target="_blank" rel="noreferrer" title="GitHub" aria-label="GitHub">
        <GithubIcon />
      </a>
      <button className="pill" onClick={share} title={copied ? 'Link copied' : 'Share'} aria-label="Share">
        {copied ? <Check size={15} strokeWidth={1.8} /> : <Share2 size={15} strokeWidth={1.7} />}
      </button>
    </nav>
  );
}
