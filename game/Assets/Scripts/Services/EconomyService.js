/* ХРОНОЛИФТ — Services/EconomyService.js
 * Игровая экономика: soft currency (монеты).
 * Faucets: этажи, идеальные остановки, достижения, ежедневная награда, покупки.
 * Sinks: возрождение за монеты (сейчас), будущие: ускорители, косметика.
 */
'use strict';

const EconomyService = {
  balance() { return save.coins; },

  grant(amount, source) {
    amount = Math.max(0, Math.round(amount));
    if (!amount) return;
    save.coins += amount;
    saveNow();
    AnalyticsService.track('economy_grant', { amount: amount, source: source, balance: save.coins });
  },

  spend(amount, source) {
    amount = Math.max(0, Math.round(amount));
    if (save.coins < amount) return false;
    save.coins -= amount;
    saveNow();
    AnalyticsService.track('economy_spend', { amount: amount, source: source, balance: save.coins });
    return true;
  }
};
