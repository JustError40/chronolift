/* ХРОНОЛИФТ — Services/AchievementService.js
 * Достижения (collection + mastery): прогресс считается из save,
 * разблокировка даёт монеты и тост. Вызывается после каждого забега.
 */
'use strict';

const AchievementService = {
  /* текущее значение прогресса по типу */
  progressOf(a) {
    switch (a.type) {
      case 'floors_run':  return save.best.floors;
      case 'coins_run':   return save.bestCoinsRun || 0;
      case 'perfects_total': return save.perfects;
      case 'games_total': return save.games;
      case 'streak':      return save.streak;
      default: return 0;
    }
  },

  isUnlocked(id) { return save.achievements.indexOf(id) !== -1; },

  /* проверка после забега; возвращает список свежих достижений [{...a}] */
  check() {
    const fresh = [];
    for (const a of ACHIEVEMENTS) {
      if (this.isUnlocked(a.id)) continue;
      if (this.progressOf(a) >= a.value) {
        save.achievements.push(a.id);
        EconomyService.grant(a.reward, 'achievement:' + a.id);
        fresh.push(a);
        AnalyticsService.track('achievement_unlocked', { id: a.id });
      }
    }
    if (fresh.length) saveNow();
    return fresh;
  }
};
