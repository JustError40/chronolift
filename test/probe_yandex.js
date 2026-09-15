// Тест интеграции с моком Яндекс Игр SDK: полный цикл платформенных вызовов.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://127.0.0.1:8321/test-yandex.html';
const PORT = 9227;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitDbg() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return true; } catch (e) {}
    await sleep(300);
  }
  return false;
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${tmp}`, '--window-size=480,800', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  process.on('exit', () => { try { chrome.kill(); } catch (e) {} });
  if (!await waitDbg()) process.exit(1);
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let mid = 0; const pending = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params) => new Promise((res) => { const id = ++mid; pending.set(id, res); ws.send(JSON.stringify({ id, method, params: params || {} })); });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result && r.result.result ? r.result.result.value : undefined;
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: BASE });
  await sleep(4500);

  console.log('=== 1. Инициализация SDK ===');
  console.log('authorized:', await evaluate('YandexClient.isAuthorized()'),
    '| name:', await evaluate('YandexClient.getName()'),
    '| lang:', await evaluate('YandexClient.lang()'));
  console.log('calls:', await evaluate('JSON.stringify(window.__YANDEX_CALLS)'));

  console.log('=== 2. Облачные сохранения ===');
  await evaluate(`(async()=>{await YandexClient.cloudSave({chronolift_save:'{"coins":777,"mock":true}'});return 'saved'})()`);
  const cloud = await evaluate(`(async()=>{const d=await YandexClient.cloudLoad();return JSON.stringify(d)})()`);
  console.log('cloud roundtrip:', cloud);

  console.log('=== 3. Лидерборд ===');
  await evaluate(`(async()=>{await YandexClient.lbSet('chronolift_floors', 33);const t=await YandexClient.lbTop('chronolift_floors',5);return JSON.stringify(t)})()`).then(x => console.log('lb entries:', x));

  console.log('=== 4. Платежи ===');
  const purch = await evaluate(`(async()=>{let ok=await new Promise(r=>YandexClient.purchase('remove_ads',r));const list=await YandexClient.getPurchases();return JSON.stringify({ok,list})})()`);
  console.log('purchase:', purch);

  console.log('=== 5. Реклама (rewarded + interstitial) ===');
  const rw = await evaluate(`(async()=>{const g=await AdsService.showRewarded('test');return 'granted='+g})()`);
  console.log(rw, '| calls:', await evaluate(`JSON.stringify(window.__YANDEX_CALLS.filter(c=>c.indexOf('adv.')===0||c.indexOf('Gameplay')===0))`));

  console.log('=== 6. Пауза/возобновление платформы ===');
  const fpsBefore = await evaluate('window.__GAME.loop.actualFps');
  await evaluate(`__triggerYandex('game_api_pause')`);
  await sleep(600);
  const sleeping = await evaluate('window.__GAME.loop.sleeping');
  const audioState = await evaluate(`(window.__GAME.sound&&window.__GAME.sound.context)?window.__GAME.sound.context.state:'none'`);
  await evaluate(`__triggerYandex('game_api_resume')`);
  await sleep(600);
  const awake = await evaluate('!window.__GAME.loop.sleeping');
  const audioAfter = await evaluate(`(window.__GAME.sound&&window.__GAME.sound.context)?window.__GAME.sound.context.state:'none'`);
  console.log('fps до:', fpsBefore, '| sleeping на паузе:', sleeping, '| audio:', audioState, '->', audioAfter, '| проснулся:', awake);

  console.log('=== 7. Итог ===');
  console.log('all calls:', await evaluate('JSON.stringify(window.__YANDEX_CALLS)'));
  console.log('ERRORS:', await evaluate('JSON.stringify(window.__ERRORS||[])'));
  ws.close(); try { chrome.kill(); } catch (e) {} process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
