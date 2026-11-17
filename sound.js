'use strict';
/* ============ Звук: эффекты и фоновая музыка, синтез Web Audio ============ */
const Sound = (() => {
  let ctx = null, master = null, sfxGain = null, musGain = null, musicOn = true, sfxOn = true, musicTimer = null, step = 0;
  try { const s = JSON.parse(localStorage.getItem('bpd_sound') || '{}'); if (s.m === false) musicOn = false; if (s.s === false) sfxOn = false; } catch (e) { }
  const save = () => { try { localStorage.setItem('bpd_sound', JSON.stringify({ m: musicOn, s: sfxOn })); } catch (e) { } };
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = .7; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = sfxOn ? .55 : 0; sfxGain.connect(master);
    musGain = ctx.createGain(); musGain.gain.value = musicOn ? .16 : 0; musGain.connect(master);
    startMusic();
  }
  const now = () => ctx.currentTime;
  function tone(f, d, { type = 'sine', vol = .5, at = 0, slide = 0, out = sfxGain, attack = .005 } = {}) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = now() + at;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0005, t + d);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + d + .05);
  }
  function noise(d, { vol = .4, at = 0, f = 1200, q = .8, type = 'bandpass', sweep = 0 } = {}) {
    if (!ctx) return;
    const n = Math.floor(ctx.sampleRate * d), buf = ctx.createBuffer(1, n, ctx.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), g = ctx.createGain(), t = now() + at;
    src.buffer = buf; flt.type = type; flt.frequency.setValueAtTime(f, t); flt.Q.value = q; if (sweep) flt.frequency.exponentialRampToValueAtTime(f * sweep, t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0005, t + d);
    src.connect(flt); flt.connect(g); g.connect(sfxGain); src.start(t);
  }
  const FX = {
    click: () => tone(660, .06, { type: 'triangle', vol: .15 }),
    card: () => { noise(.12, { vol: .25, f: 3000, sweep: .5 }); tone(880, .08, { type: 'triangle', vol: .12, at: .03 }); },
    summon: () => { noise(.5, { vol: .25, f: 400, sweep: 6 }); [523, 659, 784, 1047].forEach((f, i) => tone(f, .5, { type: 'triangle', vol: .18, at: .45 + i * .06 })); tone(130, .5, { vol: .3, at: .8 }); },
    bury: () => { tone(90, .5, { vol: .45, slide: .5 }); noise(.4, { vol: .25, f: 300, type: 'lowpass' }); },
    attack: () => { noise(.35, { vol: .35, f: 800, sweep: 4 }); tone(220, .3, { type: 'sawtooth', vol: .08, slide: 2 }); },
    hit: () => { noise(.22, { vol: .5, f: 900, q: .6 }); tone(110, .25, { type: 'square', vol: .15, slide: .5 }); },
    buff: () => { [784, 988, 1175].forEach((f, i) => tone(f, .35, { type: 'sine', vol: .14, at: i * .05 })); },
    gate: () => { tone(55, 1.6, { type: 'sawtooth', vol: .18, slide: 2, attack: .3 }); noise(1.4, { vol: .2, f: 200, sweep: 10 }); [392, 523, 659, 784].forEach((f, i) => tone(f, 1.2, { type: 'triangle', vol: .1, at: .6 + i * .08 })); },
    win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, .4, { type: 'triangle', vol: .2, at: i * .1 })); },
    lose: () => { [392, 330, 262].forEach((f, i) => tone(f, .45, { type: 'triangle', vol: .18, at: i * .14 })); },
    ko: () => { tone(300, 1, { type: 'sawtooth', vol: .2, slide: .15 }); noise(.8, { vol: .35, f: 600, sweep: .2 }); },
    heal: () => { [660, 880, 1320].forEach((f, i) => tone(f, .4, { vol: .12, at: i * .07 })); },
    round: () => { [262, 392, 523, 784].forEach((f, i) => tone(f, .7, { type: 'triangle', vol: .2, at: i * .12 })); },
  };
  function play(k) { if (!ctx || !sfxOn) return; const f = FX[k]; if (f) try { f(); } catch (e) { } }
  // тихий мистический эмбиент: медленные аккорды + колокольчики
  const CH = [[110, 164.8, 220, 261.6], [98, 146.8, 196, 233.1], [87.3, 130.8, 174.6, 220], [103.8, 155.6, 207.7, 246.9]];
  function startMusic() {
    if (musicTimer || !ctx) return;
    const bar = () => {
      if (!ctx) return;
      const c = CH[step % CH.length]; step++;
      c.forEach((f, i) => tone(f, 7.5, { type: i === 0 ? 'triangle' : 'sine', vol: i === 0 ? .35 : .18, attack: 1.8, out: musGain }));
      for (let k = 0; k < 3; k++) if (Math.random() < .6) tone(c[1 + Math.floor(Math.random() * 3)] * 4, 1.6, { type: 'sine', vol: .07, at: 1 + k * 2 + Math.random(), out: musGain });
    };
    bar(); musicTimer = setInterval(bar, 7000);
  }
  return {
    init, play,
    get music() { return musicOn; }, get sfx() { return sfxOn; },
    toggleMusic() { init(); musicOn = !musicOn; if (musGain) musGain.gain.setTargetAtTime(musicOn ? .16 : 0, now(), .3); save(); },
    toggleSfx() { init(); sfxOn = !sfxOn; if (sfxGain) sfxGain.gain.value = sfxOn ? .55 : 0; save(); },
  };
})();
