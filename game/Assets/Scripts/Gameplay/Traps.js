/* ХРОНОЛИФТ — Gameplay/Traps.js
 * Ловушки шахты. Параметры берутся из Assets/Prefabs/traps.json (prefab-конфиги),
 * скорость циклов масштабируется сложностью этажа.
 */
'use strict';

class LaserTrap {
  constructor(scene, ledgeY, diff, prefab) {
    this.scene = scene; this.ledgeY = ledgeY;
    this.type = 'laser';
    this.beamY = ledgeY - 150;
    this.d = scene.add.image(240, ledgeY + 6, 'trap_laser').setScale(1.25).setDepth(5);
    this.glow = scene.add.rectangle(240, this.beamY, 400, 22, 0xff3b3b, 0).setDepth(6);
    this.beam = scene.add.rectangle(240, this.beamY, 396, 9, 0xff5b5b, 0).setDepth(7);
    this.phase = 'off'; this.t = 0;
    this.durOff = prefab.durOff / diff; this.durTele = prefab.durTele; this.durOn = prefab.durOn / diff;
    this.dangerous = false;
    this.hadFreezeWhileDanger = false;
    this.done = false;
  }
  update(dtMs) {
    this.t += dtMs;
    if (this.phase === 'off' && this.t > this.durOff) { this.phase = 'tele'; this.t = 0; }
    else if (this.phase === 'tele' && this.t > this.durTele) { this.phase = 'on'; this.t = 0; this.scene.sfx.tone(980, 0.1, 'square', 0.05); }
    else if (this.phase === 'on' && this.t > this.durOn) { this.phase = 'off'; this.t = 0; }
    const tm = this.scene.time.now * 0.02;
    if (this.phase === 'tele') {
      const a = 0.25 + 0.2 * Math.sin(tm);
      this.beam.setAlpha(a); this.glow.setAlpha(a * 0.5); this.beam.height = 5;
    } else if (this.phase === 'on') {
      const p = 0.85 + 0.15 * Math.sin(tm * 1.7);
      this.beam.setAlpha(p); this.glow.setAlpha(0.45 * p); this.beam.height = 9;
    } else {
      this.beam.setAlpha(0); this.glow.setAlpha(0);
    }
    this.dangerous = (this.phase === 'on');
  }
  rects() {
    if (!this.dangerous) return [];
    return [{ x1: 42, x2: 438, y1: this.beamY - 11, y2: this.beamY + 11 }];
  }
  onFrozen() { if (this.dangerous) this.hadFreezeWhileDanger = true; }
  disarm() { this.phase = 'off'; this.t = 0; this.beam.setAlpha(0); this.glow.setAlpha(0); this.dangerous = false; }
  destroy() { this.d.destroy(); this.beam.destroy(); this.glow.destroy(); }
}

class SawTrap {
  constructor(scene, ledgeY, diff, prefab) {
    this.scene = scene; this.ledgeY = ledgeY;
    this.type = 'saw';
    this.railY = ledgeY - 105;
    this.prefab = prefab;
    this.diff = diff;
    this.t = Math.random() * 1000;
    this.rail = scene.add.rectangle(240, this.railY + 78, 460, 8, 0x39445a).setDepth(4);
    this.img = scene.add.image(240, this.railY, 'trap_saw').setScale(0.72).setDepth(6);
    this.dangerous = true;
    this.hadFreezeWhileDanger = false;
    this.done = false;
    this.x = 240;
  }
  update(dtMs) {
    this.t += dtMs * (0.9 + this.diff * 0.15);
    this.x = 240 + Math.sin(this.t * 0.0016 * this.prefab.speed) * this.prefab.amplitude;
    this.img.setX(this.x);
    this.img.rotation -= 0.12;
  }
  rects() { return [{ x1: this.x - 52, x2: this.x + 52, y1: this.railY - 52, y2: this.railY + 52 }]; }
  onFrozen() { this.hadFreezeWhileDanger = true; }
  disarm() {}
  destroy() { this.img.destroy(); this.rail.destroy(); }
}

class SpikesTrap {
  constructor(scene, ledgeY, diff, prefab) {
    this.scene = scene; this.ledgeY = ledgeY;
    this.type = 'spikes';
    this.t = 0;
    this.phase = 'hidden';
    this.durHidden = prefab.durHidden / diff; this.durWarn = prefab.durWarn; this.durOut = prefab.durOut / diff;
    this.base = scene.add.rectangle(240, ledgeY - 4, 460, 12, 0x2b3442).setDepth(4);
    this.img = scene.add.image(240, ledgeY + 34, 'trap_spikes').setScale(1.12).setDepth(6);
    this.imgYOut = ledgeY - 16; this.imgYIn = ledgeY + 34;
    this.dangerous = false;
    this.hadFreezeWhileDanger = false;
    this.done = false;
  }
  update(dtMs) {
    this.t += dtMs;
    if (this.phase === 'hidden' && this.t > this.durHidden) { this.phase = 'warn'; this.t = 0; }
    else if (this.phase === 'warn' && this.t > this.durWarn) { this.phase = 'out'; this.t = 0; this.scene.sfx.tone(140, 0.15, 'square', 0.07, 90); }
    else if (this.phase === 'out' && this.t > this.durOut) { this.phase = 'hidden'; this.t = 0; }
    if (this.phase === 'warn') {
      const k = this.t / this.durWarn;
      this.img.setY(Phaser.Math.Linear(this.imgYIn, this.imgYOut, Math.min(1, k * 0.6)));
      this.img.setAlpha(0.6 + 0.4 * Math.sin(this.scene.time.now * 0.03));
    } else if (this.phase === 'out') {
      const k = Math.min(1, this.t / 120);
      this.img.setY(Phaser.Math.Linear(this.imgYIn, this.imgYOut, k)).setAlpha(1);
    } else {
      const k = Math.max(0, 1 - this.t / 150);
      this.img.setY(Phaser.Math.Linear(this.imgYIn, this.imgYOut, k)).setAlpha(1);
    }
    this.dangerous = (this.phase === 'out');
  }
  rects() {
    if (!this.dangerous) return [];
    return [{ x1: 55, x2: 425, y1: this.ledgeY - 105, y2: this.ledgeY - 4 }];
  }
  onFrozen() { if (this.dangerous) this.hadFreezeWhileDanger = true; }
  disarm() { this.phase = 'hidden'; this.t = 0; this.dangerous = false; this.img.setY(this.imgYIn); }
  destroy() { this.img.destroy(); this.base.destroy(); }
}

const TRAP_CLASSES = { laser: LaserTrap, saw: SawTrap, spikes: SpikesTrap };

/* --- Пресс: бьёт сверху вниз. Проскальзывай, пока поднят. --- */
class CrusherTrap {
  constructor(scene, ledgeY, diff, prefab) {
    this.scene = scene; this.ledgeY = ledgeY;
    this.type = 'crusher';
    this.pxPerWorld = 159;                 // при scale 1.1 обеих спрайтов
    this.frame = scene.add.image(240, ledgeY - 1.675 * this.pxPerWorld, 'trap_crusher_frame')
      .setScale(1.1).setDepth(5);
    this.press = scene.add.image(240, ledgeY - 2.05 * this.pxPerWorld, 'trap_crusher_press')
      .setScale(1.1).setDepth(6);
    this.yUp = ledgeY - 2.05 * this.pxPerWorld;
    this.yDown = ledgeY - 0.55 * this.pxPerWorld;
    this.phase = 'up'; this.t = 0;
    this.durUp = prefab.durUp / diff; this.durWarn = prefab.durWarn;
    this.slamTime = prefab.slamTime; this.durHold = prefab.durHold / diff; this.durRise = prefab.durRise;
    this.dangerous = false;
    this.hadFreezeWhileDanger = false;
    this.done = false;
  }
  update(dtMs) {
    this.t += dtMs;
    if (this.phase === 'up' && this.t > this.durUp) { this.phase = 'warn'; this.t = 0; this.shakeT = 0; }
    else if (this.phase === 'warn' && this.t > this.durWarn) { this.phase = 'slam'; this.t = 0; this.scene.sfx.tone(120, 0.2, 'square', 0.09, 60); }
    else if (this.phase === 'slam') {
      const k = Math.min(1, this.t / this.slamTime);
      this.press.y = Phaser.Math.Linear(this.yUp, this.yDown, k * k); // ускорение вниз
      if (k >= 1) {
        this.phase = 'hold'; this.t = 0;
        this.scene.cameras.main.shake(120, 0.004);
        this.scene.sfx.tone(70, 0.25, 'sawtooth', 0.12, 40);
      }
    }
    else if (this.phase === 'hold' && this.t > this.durHold) { this.phase = 'rise'; this.t = 0; }
    else if (this.phase === 'rise') {
      const k = Math.min(1, this.t / this.durRise);
      this.press.y = Phaser.Math.Linear(this.yDown, this.yUp, k);
      if (k >= 1) { this.phase = 'up'; this.t = 0; }
    }
    if (this.phase === 'warn') {
      this.shakeT += dtMs;
      this.press.x = 240 + Math.sin(this.shakeT * 0.09) * 4;
    } else if (this.phase !== 'slam') {
      this.press.x = 240;
    }
    this.dangerous = (this.phase === 'slam' || this.phase === 'hold');
  }
  rects() {
    if (!this.dangerous) return [];
    return [{ x1: 110, x2: 370, y1: this.ledgeY - 160, y2: this.ledgeY - 8 }];
  }
  onFrozen() { if (this.dangerous) this.hadFreezeWhileDanger = true; }
  disarm() { this.phase = 'up'; this.t = 0; this.press.y = this.yUp; this.dangerous = false; }
  destroy() { this.frame.destroy(); this.press.destroy(); }
}

/* --- Тесла: заряжается и бьёт дугой через весь проём. --- */
class TeslaTrap {
  constructor(scene, ledgeY, diff, prefab) {
    this.scene = scene; this.ledgeY = ledgeY;
    this.type = 'tesla';
    this.arcY = ledgeY - 150;
    this.img = scene.add.image(240, ledgeY - 0.97 * 96, 'trap_tesla')
      .setScale(0.45).setDepth(5);
    this.glow = scene.add.rectangle(240, this.arcY, 400, 26, 0xb26bff, 0).setDepth(6);
    this.arc = scene.add.graphics().setDepth(7);
    this.phase = 'idle'; this.t = 0;
    this.durIdle = prefab.durIdle / diff; this.durCharge = prefab.durCharge; this.durZap = prefab.durZap / diff;
    this.dangerous = false;
    this.hadFreezeWhileDanger = false;
    this.done = false;
    this.arcT = 0;
  }
  update(dtMs) {
    this.t += dtMs;
    this.arcT += dtMs;
    if (this.phase === 'idle' && this.t > this.durIdle) { this.phase = 'charge'; this.t = 0; }
    else if (this.phase === 'charge' && this.t > this.durCharge) {
      this.phase = 'zap'; this.t = 0;
      this.scene.sfx.tone(1600, 0.18, 'sawtooth', 0.08, 300);
    }
    else if (this.phase === 'zap' && this.t > this.durZap) { this.phase = 'idle'; this.t = 0; this.arc.clear(); this.glow.setAlpha(0); }

    if (this.phase === 'charge') {
      const k = this.t / this.durCharge;
      const pulse = 0.5 + 0.5 * Math.sin(this.arcT * 0.05);
      this.img.setTint(pulse * k > 0.55 ? 0xd9baff : 0xffffff);
      this.glow.setAlpha(0.08 + 0.12 * k * pulse);
    } else if (this.phase === 'zap') {
      this.glow.setAlpha(0.35 + 0.15 * Math.sin(this.arcT * 0.06));
      this.drawArc();
    } else {
      this.img.clearTint();
    }
    this.dangerous = (this.phase === 'zap');
  }
  drawArc() {
    const g = this.arc;
    g.clear();
    g.lineStyle(3, 0xd9baff, 0.95);
    const segs = 9;
    let px = 40, py = this.arcY;
    g.beginPath();
    g.moveTo(px, py);
    for (let i = 1; i <= segs; i++) {
      const nx = 40 + (400 / segs) * i;
      const ny = this.arcY + (i === segs ? 0 : (Math.random() - 0.5) * 26);
      g.lineTo(nx, ny);
      px = nx; py = ny;
    }
    g.strokePath();
  }
  rects() {
    if (!this.dangerous) return [];
    return [{ x1: 42, x2: 438, y1: this.arcY - 13, y2: this.arcY + 13 }];
  }
  onFrozen() { if (this.dangerous) this.hadFreezeWhileDanger = true; }
  disarm() { this.phase = 'idle'; this.t = 0; this.dangerous = false; this.arc.clear(); this.glow.setAlpha(0); }
  destroy() { this.img.destroy(); this.glow.destroy(); this.arc.destroy(); }
}

TRAP_CLASSES.crusher = CrusherTrap;
TRAP_CLASSES.tesla = TeslaTrap;
