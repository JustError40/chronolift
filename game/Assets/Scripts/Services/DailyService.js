/* ХРОНОЛИФТ — Services/DailyService.js
 * Ежедневная награда + серия входов (streak): прерывистая шкала 7 дней,
 * variable reward растёт с длиной серии (психология награды, лекция 5).
 */
'use strict';

const DailyService = {
  _dateStr(d) { return d.toISOString().slice(0, 10); },
  today() { return this._dateStr(new Date()); },
  yesterday() { const d = new Date(); d.setDate(d.getDate() - 1); return this._dateStr(d); },

  /* null, если сегодня уже забрали; иначе { streak, reward } — streak та, что БУДЕТ после клейма */
  pending() {
    if (save.lastDaily === this.today()) return null;
    const streak = (save.lastDaily === this.yesterday()) ? save.streak + 1 : 1;
    const reward = DAILY_REWARDS[Math.min(streak, DAILY_REWARDS.length) - 1];
    return { streak: streak, reward: reward };
  },

  claim() {
    const p = this.pending();
    if (!p) return null;
    save.streak = p.streak;
    save.lastDaily = this.today();
    EconomyService.grant(p.reward, 'daily');
    saveNow();
    AnalyticsService.track('daily_claim', { streak: p.streak, reward: p.reward });
    return p;
  }
};
