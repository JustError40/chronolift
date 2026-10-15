/* ХРОНОЛИФТ — UI/GameOverScene.js
 * Экран итогов: статистика забега, новый рекорд, свежие достижения,
 * ×2 монеты за rewarded, быстрый рестарт.
 */
'use strict';

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  init(data) { this.data = data; }
  create() {
    this.sfx = new Sfx(this);
    this.cameras.main.setBackgroundColor('#0b0f17');
    this.add.tileSprite(240, 400, 480, 800, 'bg_wall_panel')
      .setAlpha(0.18).setTint(0x39445a).setScale(1.5);

    const d = this.data;
    this.add.text(240, 105, 'ИГРА ОКОНЧЕНА', {
      fontFamily: 'Arial', fontSize: '38px', fontStyle: 'bold', color: '#ff5b5b'
    }).setOrigin(0.5).setShadow(0, 3, '#401010', 6, true, true);

    if (d.isBest) {
      const nb = this.add.text(240, 152, '★ НОВЫЙ РЕКОРД! ★', {
        fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold', color: '#ffc93c'
      }).setOrigin(0.5);
      this.tweens.add({ targets: nb, scale: 1.12, duration: 500, yoyo: true, repeat: -1 });
    }

    this.add.text(240, 225,
      'ЭТАЖЕЙ: ' + d.floors + '\nОЧКОВ: ' + d.score + '\nМОНЕТ: ' + d.coins + '\nИДЕАЛЬНЫХ: ' + d.perfects, {
      fontFamily: 'Arial', fontSize: '21px', color: '#eaf6ff', align: 'center', lineSpacing: 8
    }).setOrigin(0.5);

    /* динамическая вёрстка: блоки наград сдвигают кнопки вниз */
    let yCursor = 300;
    if (d.unlocks && d.unlocks.length) {
      const names = d.unlocks.map((a) => a.name).join(',\n');
      const u = this.add.text(240, yCursor, '🏆 ДОСТИЖЕНИЯ:\n' + names +
        '\nнаграда: +' + d.unlocks.reduce((s, a) => s + a.reward, 0) + ' монет', {
        fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: '#2fd6a3',
        backgroundColor: '#101826dd', padding: { x: 12, y: 8 }, align: 'center', lineSpacing: 6
      }).setOrigin(0.5);
      this.sfx.unlock();
      this.tweens.add({ targets: u, angle: 2, duration: 150, yoyo: true, repeat: 5 });
      yCursor += 95;
    }

    /* миссии, выполненные в этом забеге — напоминание забрать награду (ретеншн-петля) */
    if (d.missionsDone && d.missionsDone.length) {
      const mn = d.missionsDone.map((a) => a.name).join(',\n');
      this.add.text(240, yCursor, '🎯 МИССИИ:\n' + mn +
        '\nзаберите награду в меню', {
        fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', color: '#ffc93c',
        backgroundColor: '#101826dd', padding: { x: 12, y: 8 }, align: 'center', lineSpacing: 6
      }).setOrigin(0.5);
      yCursor += 95;
    }

    const playY = Math.min(yCursor + 20, 470);
    makeButton(this, 240, playY, 280, 62, 'ЕЩЁ РАЗ', {
      fontSize: 26, color: 0x123a2e, accent: 0x2fd6a3,
      onClick: () => this.scene.start('Game')
    });
    makeButton(this, 240, playY + 76, 280, 52, 'МЕНЮ', {
      onClick: () => this.scene.start('Menu')
    });

    this.x2used = false;
    const x2r = this.add.rectangle(240, playY + 152, 280, 52, 0x3a2e10, 0.98)
      .setStrokeStyle(2, 0xffc93c).setInteractive({ useHandCursor: true });
    this.x2t = this.add.text(240, playY + 152, '×2 МОНЕТЫ (реклама)', {
      fontFamily: 'Arial', fontSize: '20px', fontStyle: 'bold', color: '#ffe89b'
    }).setOrigin(0.5);
    x2r.on('pointerdown', async () => {
      if (this.x2used) return;
      this.x2t.setText('Загрузка рекламы…');
      x2r.disableInteractive();
      const ok = await AdsService.showRewarded('double_coins');
      if (ok) {
        this.x2used = true;
        EconomyService.grant(d.coins, 'ad_double');
        this.x2t.setText('МОНЕТЫ УДВОЕНЫ! +' + d.coins);
        x2r.setFillStyle(0x123a2e, 1);
        this.sfx.coin();
      } else {
        this.x2t.setText('×2 МОНЕТЫ (реклама)');
        x2r.setInteractive({ useHandCursor: true });
      }
    });

    this.add.text(240, 760, 'Всего монет: ' + save.coins + '   ·   Рекорд: ' + save.best.floors + ' этажей', {
      fontFamily: 'Arial', fontSize: '16px', color: '#9fb4c8'
    }).setOrigin(0.5);
  }
}
