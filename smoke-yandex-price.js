import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const FILES = ['omoti_kassa.html', 'omoti_sovetskaya.html', 'omoti_anikina.html'];

function extractFunction(html, name) {
  const match = html.match(new RegExp(`function ${name}\\([^\\n]+`));
  assert.ok(match, `${name} exists`);
  return match[0];
}

for (const file of FILES) {
  const html = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  const context = vm.createContext({
    PREMIUM: new Set(['Дубайский шоколад', 'Криспи', 'Базилик клубника лайм', 'Улун персик']),
    YANDEX_UNIFORM_MOCHI_PRICE: 250,
    YANDEX_UNIFORM_MOCHI_PRICE_FROM: '2026-08-25',
    editNum: null,
    editDate: '',
    promotionNow: () => new Date('2026-08-24T17:00:00.000Z'),
  });
  vm.runInContext([
    extractFunction(html, 'priceDateIso'),
    extractFunction(html, 'activePriceDateIso'),
    extractFunction(html, 'yandexMochiPrice'),
    extractFunction(html, 'getPrice'),
  ].join('\n'), context);

  assert.equal(vm.runInContext("getPrice('Клубника','Яндекс')", context), 250, `${file}: ordinary mochi is 250 from 25.08`);
  assert.equal(vm.runInContext("getPrice('Дубайский шоколад','Яндекс')", context), 250, `${file}: premium mochi remains 250`);
  assert.equal(vm.runInContext("getPrice('Мункейки','Яндекс')", context), 750, `${file}: mooncake price is unchanged`);
  assert.equal(vm.runInContext("getPrice('Клубника','Наличный')", context), 180, `${file}: retail price is unchanged`);

  context.editNum = 'historic-check';
  context.editDate = '24.08.2026';
  assert.equal(vm.runInContext("getPrice('Клубника','Яндекс')", context), 200, `${file}: pre-change history stays at 200`);
  assert.equal(vm.runInContext("getPrice('Базилик клубника лайм','Яндекс')", context), 250, `${file}: historical premium price stays at 250`);
}

console.log('cashier Yandex effective-date pricing smoke: ok');
