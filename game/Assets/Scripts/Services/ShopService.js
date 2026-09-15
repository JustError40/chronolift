/* ХРОНОЛИФТ — Services/ShopService.js
 * Внутриигровой магазин: каталог, покупки (IAP через платёжный SDK Яндекса),
 * восстановление покупок, облачная синхронизация владения.
 */
'use strict';

const ShopService = {
  catalog() {
    return PRODUCTS.map((p) => Object.assign({}, p, { owned: !!save.purchases[p.id] }));
  },

  owns(id) { return !!save.purchases[id]; },

  /* применяет эффект покупки; вызывается и при покупке, и при restore */
  applyPurchase(id, silent) {
    save.purchases[id] = true;
    if (id === 'coins_pack') EconomyService.grant(500, 'iap_coins_pack');
    saveNow();
    if (!silent) AnalyticsService.track('purchase_done', { id: id });
  },

  /* покупка: resolves(true) при успехе */
  buy(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return Promise.resolve(false);
    if (save.purchases[id] && !p.consumable) return Promise.resolve(false);
    AnalyticsService.track('purchase_requested', { id: id });
    return new Promise((resolve) => {
      YandexClient.purchase(id, (ok) => {
        if (ok) this.applyPurchase(id);
        else AnalyticsService.track('purchase_failed', { id: id });
        resolve(ok);
      });
    });
  },

  /* восстановление покупок на новом устройстве/браузере */
  async restore() {
    const list = await YandexClient.getPurchases();
    let n = 0;
    for (const pur of list) {
      const pid = pur.productID || pur.productId;
      if (pid && !save.purchases[pid]) { this.applyPurchase(pid, true); n++; }
    }
    AnalyticsService.track('purchase_restore', { restored: n });
    return n;
  }
};
