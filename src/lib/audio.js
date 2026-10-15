// A small Web Audio bamboo-flute voice and a beat-based transport.

const BLOW_LEVEL = { soft: 0.75, medium: 0.9, strong: 1 };

function makeNoise(ctx) {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function makeImpulse(ctx, seconds = 2.2, decay = 3) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
  }
  return buf;
}

class FluteVoice {
  constructor(synth, freq, when, dur, { blow = 'medium', stress = 0.5, slur = false }) {
    const ctx = synth.ctx;
    const level = BLOW_LEVEL[blow] ?? 0.9;
    const peak = 0.16 * level * (0.82 + 0.36 * stress);
    const attack = slur ? 0.025 : 0.055;
    const end = when + Math.max(dur, 0.06);
    this.end = end + 0.15;
    this.nodes = [];

    const out = ctx.createGain();
    out.gain.setValueAtTime(0, when);
    out.gain.linearRampToValueAtTime(peak * 1.12, when + attack);
    out.gain.linearRampToValueAtTime(peak, when + attack + 0.09);
    out.gain.setValueAtTime(peak, Math.max(when + attack + 0.09, end - 0.04));
    out.gain.linearRampToValueAtTime(0, end + 0.07);
    out.connect(synth.bus);
    this.out = out;

    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = Math.min(9000, freq * (3 + 2 * level));
    tone.Q.value = 0.4;
    tone.connect(out);

    const vib = ctx.createOscillator();
    vib.frequency.value = 5.1;
    const vibDepth = ctx.createGain();
    vibDepth.gain.setValueAtTime(0, when);
    vibDepth.gain.linearRampToValueAtTime(dur > 0.45 ? 11 : 3, when + Math.min(0.5, dur));

    vib.connect(vibDepth);
    const partials = [
      [1, 1],
      [2, 0.2 * level],
      [3, 0.07 * level],
      [4, 0.025],
    ];
    for (const [mult, gain] of partials) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * mult;
      vibDepth.connect(o.detune);
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g).connect(tone);
      o.start(when);
      o.stop(end + 0.12);
      this.nodes.push(o);
    }
    vib.start(when);
    vib.stop(end + 0.12);
    this.nodes.push(vib);

    // Breath: band-passed noise, strongest at the attack.
    const noise = ctx.createBufferSource();
    noise.buffer = synth.noise;
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq * 1.6;
    bp.Q.value = 0.9;
    const ng = ctx.createGain();
    const chiff = slur ? 0.012 : 0.05 * level;
    ng.gain.setValueAtTime(0, when);
    ng.gain.linearRampToValueAtTime(chiff, when + 0.02);
    ng.gain.linearRampToValueAtTime(0.01 * level, when + 0.12);
    ng.gain.setValueAtTime(0.01 * level, Math.max(when + 0.12, end - 0.04));
    ng.gain.linearRampToValueAtTime(0, end + 0.05);
    noise.connect(bp).connect(ng).connect(out);
    noise.start(when, Math.random());
    noise.stop(end + 0.12);
    this.nodes.push(noise);
  }

  cancel(ctx) {
    const t = ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(0, t, 0.015);
    for (const n of this.nodes) {
      try {
        n.stop(t + 0.08);
      } catch {
        // already stopped
      }
    }
  }
}

export class FluteSynth {
  constructor() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    this.noise = makeNoise(ctx);

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);

    this.bus = ctx.createGain();
    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    this.bus.connect(this.master);
    this.bus.connect(reverb).connect(wet).connect(this.master);
  }

  play(freq, when, dur, opts) {
    return new FluteVoice(this, freq, when, dur, opts);
  }

  setMuted(m) {
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.03);
  }
}

// Transport measured in beats. `notes` carry beat, dur and a precomputed freq.
export class Player {
  constructor() {
    this.synth = null;
    this.notes = [];
    this.tempo = 90;
    this.speed = 1;
    this.playing = false;
    this.anchorBeat = 0;
    this.anchorTime = 0;
    this.pausedBeat = 0;
    this.endBeat = 0;
    this.voices = [];
    this.nextIndex = 0;
    this.timer = null;
    this.onEnd = null;
    this.loop = null; // { start, end } in beats
  }

  // While a loop is set, playback stays inside [start, end).
  setLoop(loop) {
    this.loop = loop;
    if (!loop) return;
    const b = this.beat();
    if (b < loop.start - 1e-6 || b >= loop.end) this.seek(loop.start);
  }

  inLoop(beat) {
    const l = this.loop;
    if (!l || (beat >= l.start - 1e-6 && beat < l.end)) return beat;
    return l.start;
  }

  load(notes, tempo, endBeat, startBeat = 0) {
    this.stopVoices();
    this.notes = notes;
    this.tempo = tempo;
    this.endBeat = endBeat;
    this.pausedBeat = startBeat;
    if (this.playing) this.anchor(startBeat);
  }

  get bps() {
    return (this.tempo / 60) * this.speed;
  }

  beat() {
    if (!this.playing) return this.pausedBeat;
    const t = this.synth.ctx.currentTime;
    // until a scheduled loop jump happens, time still runs on the old segment
    if (this.prev && t < this.anchorTime) return this.prev.beat + (t - this.prev.time) * this.bps;
    this.prev = null;
    return this.anchorBeat + (t - this.anchorTime) * this.bps;
  }

  beatToTime(b) {
    return this.anchorTime + (b - this.anchorBeat) / this.bps;
  }

  anchor(beat) {
    this.prev = null;
    this.anchorBeat = beat;
    this.anchorTime = this.synth.ctx.currentTime + 0.03;
    this.nextIndex = this.notes.findIndex((n) => n.beat + n.dur > beat + 0.08);
    if (this.nextIndex < 0) this.nextIndex = this.notes.length;
  }

  async play() {
    if (this.playing) return;
    if (!this.synth) this.synth = new FluteSynth();
    if (this.synth.ctx.state !== 'running') await this.synth.ctx.resume();
    if (this.pausedBeat >= this.endBeat) this.pausedBeat = 0;
    this.pausedBeat = this.inLoop(this.pausedBeat);
    this.playing = true;
    this.anchor(this.pausedBeat);
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 25);
  }

  pause() {
    if (!this.playing) return;
    this.pausedBeat = this.beat();
    this.playing = false;
    clearInterval(this.timer);
    this.stopVoices();
  }

  seek(beat) {
    if (this.playing) beat = this.inLoop(beat);
    this.pausedBeat = beat;
    if (this.playing) {
      this.stopVoices();
      this.anchor(beat);
      this.schedule();
    }
  }

  setSpeed(s) {
    const b = this.beat();
    this.speed = s;
    this.seek(b);
  }

  setMuted(m) {
    this.muted = m;
    this.synth?.setMuted(m);
  }

  stopVoices() {
    if (this.synth) for (const v of this.voices) v.cancel(this.synth.ctx);
    this.voices = [];
  }

  schedule() {
    const ctx = this.synth.ctx;
    const loop = this.loop;
    const shown = this.beat();
    if (!loop && shown >= this.endBeat) {
      this.pause();
      this.pausedBeat = this.endBeat;
      this.onEnd?.();
      return;
    }
    // position on the current anchor (may sit before loop.start right after a jump is queued)
    let now = this.anchorBeat + (ctx.currentTime - this.anchorTime) * this.bps;
    let horizon = now + 0.2 * this.bps;
    if (!loop) {
      this.scheduleUntil(horizon, now);
    } else {
      this.scheduleUntil(Math.min(horizon, loop.end), now);
      if (horizon >= loop.end && !this.prev) {
        // queue the jump back to loop.start exactly at loop.end, sample-accurate
        const wrapTime = this.beatToTime(loop.end);
        this.prev = { beat: this.anchorBeat, time: this.anchorTime };
        this.anchorBeat = loop.start;
        this.anchorTime = wrapTime;
        this.nextIndex = this.notes.findIndex((n) => n.beat + n.dur > loop.start + 0.05);
        if (this.nextIndex < 0) this.nextIndex = this.notes.length;
        now = loop.start + (now - loop.end);
        horizon = loop.start + (horizon - loop.end);
        this.scheduleUntil(Math.min(horizon, loop.end), now);
      }
    }
    this.voices = this.voices.filter((v) => v.end > ctx.currentTime);
  }

  scheduleUntil(horizon, now) {
    const ctx = this.synth.ctx;
    const loop = this.loop;
    while (this.nextIndex < this.notes.length && this.notes[this.nextIndex].beat < horizon) {
      const n = this.notes[this.nextIndex++];
      const start = Math.max(n.beat, now, loop ? loop.start : -Infinity);
      const stop = loop ? Math.min(n.beat + n.dur, loop.end) : n.beat + n.dur;
      if (stop - start < 0.05) continue;
      const when = Math.max(this.beatToTime(start), ctx.currentTime);
      const dur = (stop - start) / this.bps;
      // a tiny gap keeps repeated notes articulated
      const gap = n.articulation === 'slurred' ? 0 : Math.min(0.04, dur * 0.12);
      this.voices.push(
        this.synth.play(n.freq, when, dur - gap, {
          blow: n.blow,
          stress: n.stress ?? 0.5,
          slur: n.articulation === 'slurred',
        }),
      );
    }
  }
}
