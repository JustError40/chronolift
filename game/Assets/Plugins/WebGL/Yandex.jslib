/* ХРОНОЛИФТ — Plugins/WebGL/Yandex.jslib
 * Мост «движок ↔ Яндекс SDK» в формате Unity jslib (контракт из курса).
 * В веб-сборке Phaser ту же роль выполняет Assets/Scripts/YandexSDK/YandexSDK.js;
 * этот файл — эталонный контракт вызовов для порта на Unity и для плагина WebGL.
 */
mergeInto(LibraryManager.library, {
  // Rewarded-реклама: onRewardedGranted(id) / onRewardedClosed(id)
  YGShowRewarded: function (placementPtr) {
    var placement = UTF8ToString(placementPtr);
    YandexClient.rewarded(function (granted) {
      if (granted && typeof onRewardedGranted === 'function') onRewardedGranted(placement);
      else if (typeof onRewardedClosed === 'function') onRewardedClosed(placement);
    });
  },
  // Interstitial: onInterstitialClosed()
  YGShowInterstitial: function () {
    YandexClient.fullscreen(function () {
      if (typeof onInterstitialClosed === 'function') onInterstitialClosed();
    });
  },
  // Лидерборд: submitScore(namePtr, score)
  YGSubmitScore: function (boardPtr, score) {
    YandexClient.lbSet(UTF8ToString(boardPtr), score);
  },
  // Покупка: onPurchaseResult(idPtr, ok)
  YGPurchase: function (idPtr) {
    var id = UTF8ToString(idPtr);
    YandexClient.purchase(id, function (ok) {
      if (typeof onPurchaseResult === 'function') onPurchaseResult(id, ok);
    });
  }
});
