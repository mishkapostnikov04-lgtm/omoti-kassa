import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const FILES = ['omoti_kassa.html', 'omoti_sovetskaya.html'];

function extractFunction(html, name) {
  const match = html.match(new RegExp(`^function ${name}\\([^\\n]+`, 'm'));
  assert.ok(match, `${name} exists`);
  return match[0];
}

for (const file of FILES) {
  const html = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  const source = [
    'activeFlavors',
    'restockExactInputId',
    'restockHeadId',
    'renderRestockOptions',
    'selectedRestockMotiItems',
  ].map((name) => extractFunction(html, name)).join('\n');

  let supplyButtons = [{
    dataset: { restockValue: 'cups' },
    classList: { contains: () => true },
  }];
  const supplies = {
    querySelectorAll(selector) {
      return selector === '.restock-option.active'
        ? supplyButtons.filter((button) => button.classList.contains('active'))
        : supplyButtons;
    },
    set innerHTML(_value) {
      supplyButtons = [{
        dataset: { restockValue: 'cups' },
        active: false,
        classList: {
          contains(name) { return name === 'active' && this.owner.active; },
          toggle(name, enabled) { if (name === 'active') this.owner.active = enabled; },
        },
      }];
      supplyButtons[0].classList.owner = supplyButtons[0];
    },
  };
  const flavors = { className: '', innerHTML: '' };
  const context = vm.createContext({
    promotionConfig: { assortment: [
      { name: 'Видимый', catalogItemId: 'id-visible' },
      { name: 'Новый', catalogItemId: 'id-new' },
    ] },
    FLAVORS: ['Видимый', 'Скрытый'],
    uiFlavorName: (name) => name,
    restockMotiFacts: {
      Видимый: { mode: 'exact', qty: 2 },
      Скрытый: { mode: 'exact', qty: 0 },
      Новый: { mode: 'more_than_5', qty: 6 },
    },
    cashierKnownAssortment: { Новый: { catalogItemId: 'id-new' } },
    restockStockInfo: () => null,
    restockMotiCard: (name) => `<article>${name}</article>`,
    restockOption: () => '<button></button>',
    RESTOCK_SUPPLIES: [['cups', 'Стаканчики']],
    document: { getElementById: (id) => ({ 'restock-flavors': flavors, 'restock-supplies': supplies })[id] },
    renderRestockLastSent: () => {},
    updateRestockSubmitState: () => {},
    focusRestockExactEditor: () => {},
    restockStockLoaded: true,
    restockStockLoading: false,
  });
  vm.runInContext(source, context);
  vm.runInContext('renderRestockOptions()', context);

  assert.match(flavors.innerHTML, /Видимый/, `${file}: visible flavor shown`);
  assert.match(flavors.innerHTML, /Новый/, `${file}: new catalog flavor shown`);
  assert.doesNotMatch(flavors.innerHTML, /Скрытый/, `${file}: hidden flavor not shown`);
  assert.equal(supplyButtons[0].active, true, `${file}: supply selection survives refresh`);

  const selected = vm.runInContext('selectedRestockMotiItems()', context);
  assert.deepEqual(Array.from(selected, (item) => item.label), ['Видимый', 'Новый'], `${file}: hidden flavor not sent`);
  assert.equal(selected[1].catalogItemId, 'id-new', `${file}: new flavor keeps catalog id`);
  assert.notEqual(
    vm.runInContext("restockHeadId('Видимый')", context),
    vm.runInContext("restockHeadId('Новый')", context),
    `${file}: dynamic flavor ids are unique`,
  );

  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, `${file}: inline script exists`);
  new Function(script);
  console.log(`${file}: restock assortment OK`);
}
