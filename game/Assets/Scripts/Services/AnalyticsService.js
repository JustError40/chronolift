/* ХРОНОЛИФТ — Services/AnalyticsService.js
 * Трекинг игровых событий: кольцевой буфер в localStorage.
 * Заменяемый транспорт: при подключении GameAnalytics/Яндекс Метрики
 * достаточно дописать отправку в track().
 */
'use strict';

const AnalyticsService = {
  KEY: 'chronolift_analytics',
  CAP: 500,

  track(event, params) {
    let buf = [];
    try { buf = JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch (e) {}
    buf.push({ t: Date.now(), event: event, params: params || {} });
    if (buf.length > this.CAP) buf = buf.slice(-this.CAP);
    try { localStorage.setItem(this.KEY, JSON.stringify(buf)); } catch (e) {}
    if (window.console && console.debug) console.debug('[analytics]', event, params || '');
  },

  flushAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch (e) { return []; }
  }
};
