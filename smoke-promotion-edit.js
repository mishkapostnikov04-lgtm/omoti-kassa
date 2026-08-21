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
  const script = [
    extractFunction(html, 'promotionById'),
    extractFunction(html, 'promotionAppliesAt'),
    extractFunction(html, 'activePromotion'),
    extractFunction(html, 'parseDateTime'),
  ].join('\n');
  const promotion = {
    id: 'promo_20260822_all20',
    name: 'Скидка 20%',
    discountPercent: 20,
    startsAt: '2026-08-21T17:00:00.000Z',
    endsAt: '2026-08-23T17:00:00.000Z',
    eligiblePayTypes: ['Безналичный', 'Наличный', 'Перевод', 'Смешанная'],
    enabled: true,
  };
  const context = vm.createContext({
    promotionConfig: { promotions: [promotion] },
    promotionNow: () => new Date('2026-08-22T05:00:00.000Z'),
    editNum: '42',
    editDate: '22.08.2026',
    editTime: '12:00',
    editOriginalPayType: 'Наличный',
    editPromotionId: promotion.id,
    editPromotionName: promotion.name,
    editPromotionDiscountPercent: promotion.discountPercent,
  });
  vm.runInContext(script, context);

  assert.equal(vm.runInContext("activePromotion('Наличный').id", context), promotion.id, `${file}: unchanged promotional pay`);
  assert.equal(vm.runInContext("activePromotion('Перевод').id", context), promotion.id, `${file}: eligible payment change`);
  assert.equal(vm.runInContext("activePromotion('Яндекс')", context), null, `${file}: excluded payment removes promotion`);

  context.editOriginalPayType = 'Яндекс';
  context.editPromotionId = '';
  context.editPromotionName = '';
  context.editPromotionDiscountPercent = 0;
  assert.equal(vm.runInContext("activePromotion('Яндекс')", context), null, `${file}: unchanged excluded pay stays without promotion`);
  assert.equal(vm.runInContext("activePromotion('Наличный').id", context), promotion.id, `${file}: excluded to eligible adds promotion`);

  context.editDate = '21.08.2026';
  assert.equal(vm.runInContext("activePromotion('Наличный')", context), null, `${file}: pre-promotion check stays without promotion`);
}

console.log('cashier promotion edit ui smoke: ok');
