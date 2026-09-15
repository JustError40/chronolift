/* ХРОНОЛИФТ — Services/LeaderboardService.js
 * Онлайн-лидерборд Яндекс Игр (глобальный, топ-N + позиция игрока).
 * Фолбэк — локальный рекорд, чтобы UI не ломался вне платформы.
 */
'use strict';

const LEADERBOARD_NAME = 'chronolift_floors';

const LeaderboardService = {
  submit(floors) {
    AnalyticsService.track('leaderboard_submit', { floors: floors });
    return YandexClient.lbSet(LEADERBOARD_NAME, floors);
  },

  /* → { entries: [{rank, name, score, me}], mine } | null */
  async top(qty) {
    const res = await YandexClient.lbTop(LEADERBOARD_NAME, qty || 5);
    if (!res || !res.entries || !res.entries.length) return null;
    const entries = res.entries.map((e) => ({
      rank: e.rank, name: (e.player && e.player.publicName) || 'Игрок',
      score: e.score, me: !!(e.player && e.player.isCurrentUser)
    }));
    let mine = null;
    if (res.userRank !== undefined) mine = { rank: res.userRank, score: res.entries.find(e => e.player && e.player.isCurrentUser) ? res.entries.find(e => e.player && e.player.isCurrentUser).score : save.best.floors };
    return { entries: entries, mine: mine };
  }
};
