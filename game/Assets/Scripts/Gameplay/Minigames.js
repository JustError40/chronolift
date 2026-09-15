/* ХРОНОЛИФТ — Gameplay/Minigames.js
 * Простые миниигры внутри забега (один ввод — тот же тап/удержание):
 *  1) «Калибровка» — вращающийся маркер, тап в зелёном секторе;
 *  2) «Заряд ячейки» — игла летает туда-сюда, тап останавливает в зелёной зоне.
 * Награда: энергия + монеты. Нет штрафа за промах — только упущенный бонус.
 */
'use strict';

class MinigameManager {
  constructor(scene) {
    this.scene = scene;
    this.active = null;
    this.count = 0;
  }

  /* запуск через каждые 4 этажа после 4-го */
  maybeStart(floorsPassed) {
    if (this.active) return;
    if (floorsPassed < 4 || floorsPassed % 4 !== 0) return;
    this.count++;
    if (this.count % 2 === 1) this.startCalibration();
    else this.startCharge();
    AnalyticsService.track('minigame_start', { type: this.active.type });
  }

  baseContainer() {
    const c = this.scene.add.container(240, 290).setScrollFactor(0).setDepth(46);
    const bg = this.scene.add.rectangle(0, 0, 260, 210, 0x101826, 0.92)
      .setStrokeStyle(2, 0x57f2ff, 0.8);
    const title = this.scene.add.text(0, -86, '', {
      fontFamily: 'Arial', fontSize: '17px', fontStyle: 'bold', color: '#57f2ff'
    }).setOrigin(0.5);
    c.add([bg, title]);
    c.title = title;
    return c;
  }

  startCalibration() {
    const c = this.baseContainer();
    c.title.setText('КАЛИБРОВКА ХРОНОЯДРА');
    const g = this.scene.add.graphics();
    c.add(g);
    this.active = {
      type: 'calibration', container: c, gfx: g,
      marker: -Math.PI / 2, speed: Math.PI * 2 / 1500,   // оборот 1.5 с
      zoneStart: -Math.PI / 2 - 0.5, zoneEnd: -Math.PI / 2 + 0.5,  // зелёный сектор ~57°
      life: 5200, done: false
    };
    this.drawCalibration();
  }

  drawCalibration() {
    const a = this.active;
    const g = a.gfx;
    g.clear();
    // кольцо
    g.lineStyle(5, 0x39506b, 1);
    g.strokeCircle(0, 0, 62);
    // зелёный сектор
    g.lineStyle(9, 0x2fd6a3, 1);
    g.beginPath();
    g.arc(0, 0, 62, a.zoneStart, a.zoneEnd, false);
    g.strokePath();
    // маркер
    g.lineStyle(4, 0xffe89b, 1);
    const mx = Math.cos(a.marker) * 62, my = Math.sin(a.marker) * 62;
    g.lineBetween(Math.cos(a.marker) * 40, Math.sin(a.marker) * 40, mx, my);
    g.fillStyle(0xffe89b, 1);
    g.fillCircle(mx, my, 6);
    g.setPosition(0, 10);
  }

  startCharge() {
    const c = this.baseContainer();
    c.title.setText('ЗАРЯД ХРОНО-ЯЧЕЙКИ');
    const g = this.scene.add.graphics();
    const barBg = this.scene.add.rectangle(0, 10, 210, 18, 0x1a2333, 1)
      .setStrokeStyle(1, 0x39506b);
    const zone = this.scene.add.rectangle(0, 10, 210 * 0.28, 18, 0x2fd6a3, 0.55);
    const needle = this.scene.add.triangle(-100, 10, 0, 10, 8, 0, 16, 10, 0xffe89b)
      .setOrigin(0.5);
    c.add([g, barBg, zone, needle]);
    this.active = {
      type: 'charge', container: c, needle: needle,
      pos: 0, dir: 1, speed: 1.35,           // полный проход ~1.5 с
      zoneL: 0.36, zoneR: 0.64,              // зелёная зона по центру
      life: 5200, done: false
    };
  }

  /* короткий тап: проверка попадания */
  tap() {
    const a = this.active;
    if (!a || a.done) return;
    let win = false;
    if (a.type === 'calibration') {
      let ang = a.marker;
      // нормализация в [zoneStart, zoneEnd] с учётом периода
      const span = Math.PI * 2;
      let rel = (ang - a.zoneStart) % span;
      if (rel < 0) rel += span;
      win = rel <= (a.zoneEnd - a.zoneStart);
    } else {
      win = (a.pos >= a.zoneL && a.pos <= a.zoneR);
    }
    a.done = true;
    this.finish(win);
  }

  finish(win) {
    const a = this.active;
    AnalyticsService.track('minigame_result', { type: a.type, win: win });
    const gs = this.scene;
    if (win) {
      gs.energy = Math.min(gs.energyMax, gs.energy + (a.type === 'calibration' ? 12 : 15));
      gs.coinsRun += 5;
      gs.sfx.reward();
      gs.hud.toast(a.type === 'calibration' ? 'КАЛИБРОВКА ТОЧНА! +12 энергии, +5 монет'
        : 'ЯЧЕЙКА ЗАРЯЖЕНА! +15 энергии, +5 монет', '#2fd6a3');
    } else {
      gs.sfx.alarm();
      gs.hud.toast('Мимо… бонус упущен', '#9fb4c8');
    }
    gs.tweens.add({ targets: a.container, alpha: 0, scale: 0.9, duration: 300, onComplete: () => a.container.destroy() });
    this.active = null;
  }

  update(dtMs) {
    const a = this.active;
    if (!a) return;
    a.life -= dtMs;
    if (a.life <= 0) {   // время вышло — тихий конец
      this.scene.tweens.add({ targets: a.container, alpha: 0, duration: 300, onComplete: () => a.container.destroy() });
      this.active = null;
      return;
    }
    if (a.type === 'calibration') {
      a.marker += a.speed * dtMs;
      this.drawCalibration();
    } else {
      a.pos += a.dir * a.speed * dtMs / 1000;
      if (a.pos > 1) { a.pos = 1; a.dir = -1; }
      if (a.pos < 0) { a.pos = 0; a.dir = 1; }
      a.needle.x = -100 + a.pos * 200;
    }
  }

  /* автотест: авто-тап когда маркер в зоне */
  autoSolve() {
    const a = this.active;
    if (!a || a.done) return;
    if (a.type === 'calibration') {
      let rel = (a.marker - a.zoneStart) % (Math.PI * 2);
      if (rel < 0) rel += Math.PI * 2;
      if (rel <= (a.zoneEnd - a.zoneStart)) this.tap();
    } else if (a.pos >= a.zoneL + 0.05 && a.pos <= a.zoneR - 0.05) {
      this.tap();
    }
  }
}
