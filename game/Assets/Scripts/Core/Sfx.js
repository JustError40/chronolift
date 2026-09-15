/* ХРОНОЛИФТ — Core/Sfx.js
 * Звук синтезируется через WebAudio (WebAudioContext Phaser) — без внешних файлов,
 * важно для лимита 15 МБ загрузки на Яндекс Играх.
 */
'use strict';

class Sfx {
  constructor(scene) {
    this.scene = scene;
    this.ctx = null;
  }
  ensure() {
    if (typeof save !== 'undefined' && !save.sound) return false;
    try {
      if (!this.ctx && this.scene.sound && this.scene.sound.context) this.ctx = this.scene.sound.context;
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { return false; }
    return !!this.ctx;
  }
  tone(freq, dur, type, vol, slideTo, delay) {
    if (!this.ensure()) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.1, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  freeze()    { this.tone(760, 0.22, 'sine', 0.14, 190); }
  unfreeze()  { this.tone(190, 0.14, 'sine', 0.10, 620); }
  coin()      { this.tone(1240, 0.07, 'square', 0.06); this.tone(1650, 0.1, 'square', 0.06, null, 0.06); }
  perfect()   { this.tone(880, 0.08, 'triangle', 0.12); this.tone(1108, 0.08, 'triangle', 0.12, null, 0.07); this.tone(1318, 0.14, 'triangle', 0.12, null, 0.14); }
  death()     { this.tone(200, 0.55, 'sawtooth', 0.18, 45); this.tone(90, 0.4, 'square', 0.1, 30, 0.05); }
  alarm()     { this.tone(520, 0.12, 'square', 0.1); this.tone(392, 0.16, 'square', 0.1, null, 0.13); }
  click()     { this.tone(640, 0.05, 'square', 0.05); }
  unlock()    { this.tone(523, 0.1, 'triangle', 0.12); this.tone(659, 0.1, 'triangle', 0.12, null, 0.09); this.tone(784, 0.1, 'triangle', 0.12, null, 0.18); this.tone(1047, 0.22, 'triangle', 0.12, null, 0.27); }
  reward()    { this.tone(659, 0.1, 'sine', 0.11); this.tone(880, 0.12, 'sine', 0.11, null, 0.09); this.tone(1318, 0.2, 'sine', 0.11, null, 0.18); }
}
