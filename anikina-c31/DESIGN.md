---
name: "OMOTI · Касса Аникина · C «Пульт» 3.1"
description: "Документация локального кандидата C3.1 R2 после первого выпуска; только касса Аникиной."
colors:
  bg: "#F3F2EE"
  surface: "#FFFFFF"
  line: "#E5E3DD"
  line-soft: "#F0EEE9"
  chip: "#E7E5DF"
  ink: "#121212"
  ink-2: "#3B3A36"
  muted: "#5E5D57"
  muted-2: "#77756F"
  amber: "#FFA21A"
  amber-line: "#F59300"
  amber-tile: "#FFF7E8"
  amber-tint: "#FFF5E3"
  amber-soft-line: "#F2C77A"
  amber-text: "#7A4300"
  amber-text-2: "#9A5B00"
  danger: "#C2410C"
  danger-2: "#D9480F"
  danger-text: "#B4400C"
  danger-tint: "#FFF1EA"
  danger-tint-2: "#FFEDE4"
  danger-line: "#F2B79A"
  svc-bg: "#FAF1DE"
  svc-line: "#EBDFC4"
  svc-chip: "#EFE2C2"
  svc-price: "#7A6A48"
  dock-btn: "#262624"
  dock-line: "#2A2A28"
  dock-text: "#F2F1EC"
  dock-muted: "#8E8C86"
  dock-off: "#5F5E59"
  dock-off-bg: "#33322F"
  dock-wait-bg: "#6B4A12"
  dock-wait-text: "#FFE2B0"
  dock-brak: "#FF8F66"
  scrim: "rgba(18,18,18,.34)"
typography:
  display:
    fontFamily: "Geologica, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Geologica, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geologica, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 700
  body:
    fontFamily: "Geologica, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
  tile:
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.15
  price:
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1
  count:
    fontSize: "19px"
    fontWeight: 800
  dock-sum:
    fontSize: "26px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  dock-button:
    fontSize: "13.5px"
    fontWeight: 600
  close-button:
    fontSize: "16px"
    fontWeight: 800
  input:
    fontSize: "16px"
  money-input:
    fontSize: "20px"
    fontWeight: 700
rounded:
  count: "9px"
  done: "12px"
  icon-button: "13px"
  button: "14px"
  sheet-button: "15px"
  tile: "16px"
  card: "18px"
  sheet: "24px"
  modal: "28px"
spacing:
  gap: "6px"
  sheet-gap: "8px"
  dock-x: "10px"
  gutter: "12px"
  dock-bottom: "16px"
components:
  close-button:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    typography: "{typography.close-button}"
    rounded: "{rounded.button}"
    height: "48px"
  close-button-disabled:
    backgroundColor: "{colors.dock-off-bg}"
    textColor: "{colors.dock-muted}"
    rounded: "{rounded.button}"
    height: "48px"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sheet-button}"
    height: "52px"
    width: "100%"
  button-light:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet-button}"
    height: "48px"
    width: "100%"
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    typography: "{typography.input}"
    rounded: "{rounded.button}"
    padding: "0 14px"
    height: "52px"
    width: "100%"
  tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    padding: "9px 10px 6px"
    height: "74px"
  tile-selected:
    backgroundColor: "{colors.amber-tile}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    height: "74px"
  counter:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    typography: "{typography.count}"
    rounded: "{rounded.count}"
    width: "32px"
    height: "28px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "12px 14px"
---

# Design System: OMOTI · Касса Аникина · C «Пульт» 3.1

## Overview

**Creative North Star: "Пульт C3.1"**

Это запись фактической локальной реализации утверждённого владельцем мобильного пульта Аникиной. Светлый рабочий экран содержит компактные товары, белые листы и карточки; тёмный док собирает чек, оплату и единственную навигацию. Янтарь показывает выбор и главное действие, красный — ошибку, брак или опасное действие. Плотность помогает ежедневной работе кассира с телефона.

Документ описывает сборку, а не вводит новый стандарт OMOTI. Утверждённый пакет [C3.1](../../design-system/modules/cashier-anikina/c31-approved-20261014/HANDOFF.md) остаётся выше этой записи. Порядок приоритета: финансовые функции и `PRESERVE.md`; дословные статусы из кода; поведение из `INTERACTIONS.md`; оригинальные PNG и HTML конкретного состояния; значения из токенов пакета. Реальные имена, ассортимент, цены, даты и суммы берутся из кода/сервера. Общая ERP DS v1.0.0 и две соседние кассы этим документом не изменяются.

**Key Characteristics:**

- Светлая рабочая поверхность и тёмный док.
- Geologica и табличные цифры.
- Три колонки товаров, отдельная область счётчика.
- Прежние DOM IDs и финансовые handlers в новых контейнерах.
- Статус, выбор и блокировка выражают фактическое состояние.

Срез документации: локальный кандидат R2 от 14.10.2026 после первого выпуска C3.1. Исходная Pages/main ревизия — `5c9eb685ac734bd832ae7c8771e6336eed948fd7`; сверка и сохранённые исходники записаны в [BASELINE.json](../../_local_artifacts/cashier-anikina-c31-20261014/BASELINE.json). Основание записи — [interface.js](interface.js), [integration.css](integration.css), [tokens.css](tokens.css), [components.css](components.css), [карта функций](../../_local_artifacts/cashier-anikina-c31-20261014/FUNCTION_MAP.md) и [контракт поверхности](../../_local_artifacts/cashier-anikina-c31-20261014/SURFACE_BRIEF.md). Идентичность прочитанного локального кода сохранена в sidecar. API/backend и владельцы финансовых расчётов этим presentation-пакетом не заменяются.

Первый опубликованный выпуск — commit `e6f7efbd8afdabf29885ca5fff05532e8b9e96d8`, build 14.10.2026 08:36:10 UTC. [PUBLISHED_AUDIT_R1.md](../../_local_artifacts/cashier-anikina-c31-20261014/PUBLISHED_AUDIT_R1.md) относится именно к нему и имеет `disposition: fix`: сверены оригинальные 71 base-состояния и 15 дополнительных сравнений, а не все 213 кадров глазами. Зафиксированы 213 captures, отсутствие runtime errors/missing fixtures/horizontal overflow и 38 совпадающих ответов по [served-assets manifest](../../_local_artifacts/cashier-anikina-c31-20261014/PUBLISHED_ASSETS-1791967035124.json). Этот аудит не принимает более новый локальный R2. Windows raw SHA и SHA опубликованных Git/LF-байтов различаются у CRLF-файлов; served-версия доказывается отдельным manifest, а не локальным hash.

Локальные исправления R2 из следующих разделов завершены в коде, но R2 на момент этой записи ещё не опубликован. Метаданные его будущей публикации и независимый public R2 verdict должны быть записаны в release report в папке доказательств вне репозитория. Ни документирование, ни `captured-needs-visual-review`, ни scalar diffRatio не означают приёмку всех 71 состояний. Нативная клавиатура iPhone/Android, реальная камера, safe-area, Safari/PWA и ветви permissions на устройствах не проверены. Все финансовые browser-прогоны используют синтетические mocks всех запросов `orders.omoti.ru`, Service Worker блокируется; реальных чеков, бонусных операций и регистрации устройств ради проверки не было.

### Evidence inventory

| Источник | Что доказывает / ограничение |
|---|---|
| [FINISH_REVIEW_R1/R2](../../_local_artifacts/cashier-anikina-c31-20261014/FINISH_REVIEW_R2.md) и [FINISH_REVIEW_FINAL](../../_local_artifacts/cashier-anikina-c31-20261014/FINISH_REVIEW_FINAL.md) | История локальных bounded scoring и исправлений; final `ship` относится к проверенным fixes до published-аудита, не ко всей текущей поверхности. |
| [published-r1/report.json](../../_local_artifacts/cashier-anikina-c31-20261014/published-r1/report.json), [JR-02 addendum](../../_local_artifacts/cashier-anikina-c31-20261014/published-r1-jr02-addendum/report.json) | Первый public capture; addendum заменяет только недостаточное состояние JR-02, старые captures сохранены. |
| [PUBLISHED_AUDIT_R1](../../_local_artifacts/cashier-anikina-c31-20261014/PUBLISHED_AUDIT_R1.md) | Независимый визуальный аудит первого public commit; список последующих presentation fixes. |
| [local-r2-final-batch](../../_local_artifacts/cashier-anikina-c31-20261014/local-r2-final-batch/report.json), [local-r2-final-closure](../../_local_artifacts/cashier-anikina-c31-20261014/local-r2-final-closure/report.json) | 33 и 9 targeted captures на своих sourceSHA, errors/missingFixtures 0; статус capture требует visual review. Нельзя объединять их в полный run одного SHA. |
| [local-r2-frozen-final](../../_local_artifacts/cashier-anikina-c31-20261014/local-r2-frozen-final/report.json) | Предыдущие 30 targeted captures на одной sourceSHA-матрице; errors/missingFixtures 0. После последнего notice/back исправления это история, не полный run текущего SHA. |
| [local-r2-final-notice](../../_local_artifacts/cashier-anikina-c31-20261014/local-r2-final-notice/report.json) | 6 targeted JR-02/JR-06 captures на sourceSHA актуального кода. Статус `captured-needs-visual-review`, не независимый verdict и не полный 213-run. |
| [canonical regression.cjs](../_qa/c31/regression.cjs) / [REGRESSION.json](../_qa/c31/REGRESSION.json) | 25 синтетических групп, errors 0, failure отсутствует, `realWrites: 0`; включены измеренная высота notice/back SVG и успешное async-confirm acceptance с одним checkout и снятием UI-lock. `_qa/c31` — локальный ignored harness, не web/deploy-файлы. Ранний task-root отчёт 19 групп и его runner — историческая диагностика, не текущая suite. |
| [GUARD_LOOP-local](../../_local_artifacts/cashier-anikina-c31-20261014/GUARD_LOOP-local.json) / [published-r1](../../_local_artifacts/cashier-anikina-c31-20261014/GUARD_LOOP-published-r1.json) | На одном hidden-SKU guard: 0 повторных disabled-mutations в локальном коде вместо 58 за 350мс в первом public выпуске; кнопка остаётся заблокирована. |
| [CARD_CAPTION-local-r2](../../_local_artifacts/cashier-anikina-c31-20261014/CARD_CAPTION-local-r2.json) | Синтетическая known-due карта: enabled close, «Закрыть чек», errors 0, realWrites 0; реальную бонусную покупку не проверяет. |

Generic `PRODUCT.md`, отдельные Impeccable build-state/spec, hero-repro, QUALITY BAR card и общий per-region comp-diff verdict не переданы. Для этого существующего приложения approved owner pack, surface brief, FUNCTION_MAP и BASELINE заменяют общую продуктовую/визуальную постановку; новый seed, hero или визуальный концепт не создаётся. Отсутствие нарисованной системной клавиатуры в headless capture допустимо, но физический keyboard/visualViewport не получает PASS.

## Colors

Палитра взята из локальной копии утверждённых токенов; имена frontmatter соответствуют суффиксам `--k-*`. Совпадающие роли не создают дополнительный цвет: поле использует фон экрана, док использует основной тёмный цвет.

### Primary

- Янтарь `amber` — счётчик, выбранная карта, основная кнопка закрытия, промо и выбранные метки; тёмный текст.
- `amber-line` и `amber-tile` — контур и светлая поверхность выбранного товара.
- `amber-tint`, `amber-soft-line`, `amber-text` — мягкие информационные поверхности, выбранная карта и бонусные сводки.
- `amber-text-2` — премиальная цена.

### Secondary

- `danger`, `danger-2` — удаление, брак, ошибочный ввод и блокирующие сообщения.
- `danger-tint`, `danger-tint-2`, `danger-line`, `danger-text` — фон, контур и текст ошибки/сверки.
- `svc-bg`, `svc-line`, `svc-chip`, `svc-price` — служебный режим. Цена всё равно определяется текущим `payType`, а не цветом экрана.

### Neutral

- `bg`, `surface`, `line`, `line-soft`, `chip` — фон, белые контейнеры, контуры и разделители.
- `ink`, `ink-2`, `muted`, `muted-2` — основной текст и иерархия подписей.
- `dock-btn`, `dock-line`, `dock-text`, `dock-muted`, `dock-off`, `dock-off-bg` — тёмный док и его состояния.
- `dock-wait-bg`, `dock-wait-text` — ожидание операции; `dock-brak` — служебный брак в доке.
- `scrim` — затемнение за листом. У меню «Ещё» затемнение прозрачно.

**The State Color Rule.** Цвет подтверждает состояние из финансового владельца; оформление не создаёт статус, доступный баланс или разрешение на повтор операции.

## Typography

**Display Font:** Geologica с запасным стеком из frontmatter. **Body Font:** тот же стек. Отдельного моноширинного шрифта нет.

`integration.css` подключает локальные TTF `geologica-400.ttf`…`geologica-800.ttf` через пять `@font-face` с `font-display: swap`. [OFL.txt](OFL.txt) хранится рядом. Внешняя загрузка Google Fonts для этой реализации не нужна. На корне включены `font-variant-numeric: tabular-nums`.

### Hierarchy

- Display — сумма выручки в светлой карточке итогов.
- Headline — «Журнал» и «Итоги».
- Title — заголовок рабочего листа; подтверждение/удаление используют более крупный заголовок (21px/800).
- Body — обычный текст; подписи преимущественно 12–12.5px, микро 11px.
- Tile и Price — двухстрочное название и отдельная цена товара. Премиальная цена имеет вес 700.
- Count, Dock Sum и Close Button — устойчивые цифры количества, сумма и главное действие.
- Input и Money Input — поля не меньше 16px; суммы 20px/700. В смешанной оплате поле выровнено влево и имеет отдельный суффикс ₽; поле бонусов остаётся выровненным вправо.

Насыщенность и размеры frontmatter фиксируют реально используемые роли. В узком fallback `<360px` название товара уменьшается до 13px. В режиме «− / +» имя занимает одну строку с многоточием (12.5px/15px), обычная плитка — до двух строк. Денежные подписи не превращаются в новые финансовые данные.

**The Numeric Roles Rule.** Количество, цена за единицу, сумма строки, сумма чека и к оплате остаются отдельными значениями с отдельной иерархией.

## Layout

Корень — `100dvh`, максимальная ширина 480px, по центру. Базовая геометрия C3.1: верхняя строка на 10px, контекст на 40px высотой 48px, сетка от 96px; к верхним зонам компонентов прибавляется `env(safe-area-inset-top)`. Поля экрана и промежутки — из frontmatter. Сетка всегда `repeat(3,minmax(0,1fr))`, товар высотой 74px. Ширины 360/390/430 меняют только ширину колонок; `<360px` имеет минимальный fallback переключателя 184px. Проверка настоящих safe-area остаётся открытой.

Док кассы: 174px при нулевой/обычной нижней safe-area; первый ряд 44px, ряд оплаты 48px, видимая навигация 40px с областью касания 51px. Нижний отступ `max(16px, env(safe-area-inset-bottom))`. Служебное уточнение оплаты добавляет 50px (док 224px), пояснение долга 58px (232px), до ряда действий. Док Журнала/Итогов — 64px. Значения 191/199px прежней редакции не являются частью C3.1.

Обычный лист имеет боковые поля 8px, низ `current dock + 8px` (182px у обычной кассы), максимальную ширину 464px. Середина прокручивается; итог чека закреплён отдельно. Подтверждение, выбор сотрудника/меню точки и удаление используют отдельные нижние контейнеры; их размеры описывает фактический `integration.css`. Список журнала и итоги прокручиваются между верхом и доком навигации. Затемнение сетки над доком — 30px.

Клавиатура: `--k-kb-h = max(0, innerHeight − visualViewport.height − visualViewport.offsetTop)`. Класс `is-kb-open` включается только при активном текстовом поле и высоте перекрытия больше 100px; док скрывается, лист смещается на высоту клавиатуры +8px. Пересчёт идёт на `visualViewport.resize/scroll` и `focusin/focusout`, поле получает `scrollIntoView({block:'nearest'})`. «Готово» закрывает фокус, Enter поиска только убирает клавиатуру. Это контракт кода, не результат проверки нативной клавиатуры.

## Elevation & Depth

Плитки и карточки используют внутренние контуры, выбранное состояние — усиленный контур. Тёмный док даёт основной уровень. Листы, тосты и подсказка имеют мягкую тень; опасное подтверждение перекрывает лист карты. В `integration.css` обычный док имеет z-index 6, лист 5, scrim 4; выбор сотрудника/точки поднимается над своим scrim, подтверждение использует 86 над scrim 84. Это локальная интеграция, не общая шкала ERP.

### Shadow Vocabulary

- Sheet — `0 20px 50px -20px rgba(0,0,0,.4)`.
- Toast — `0 0 0 1px var(--k-line), 0 14px 30px -10px rgba(0,0,0,.25)`.
- Hint — `0 10px 24px -8px rgba(0,0,0,.45)`.
- Modal — `0 -10px 40px rgba(0,0,0,.25)`.

## Shapes

Радиусы frontmatter отражают счётчик, кнопки, товары, карточки, листы и модальные окна. Повторяется мягкая прямоугольная форма. Док имеет верхние углы 28px. Кнопки «− / +» на плитке — 40–44×44px; видимый счётчик — 32×28px, псевдоэлемент расширяет касание до 50×44px. Расширенная зона не меняет видимый размер счётчика.

## Components

### Buttons

Главное закрытие — янтарная кнопка в ряду оплаты. Disabled, wait и brak задаются состоянием владельца; в ожидании действует одна горизонтальная CTA со spinner и `aria-busy`, выбранный способ скрывается. Кнопки листов: тёмная 52px, светлая 48px, янтарная 52px; опасная контурная 44px, отдельна от редактирования. Общий `:focus-visible` — янтарная обводка 2px с offset 3px. Новой hover-палитры в реализации нет.

### Chips

Метки очереди, акции, карты, правки и сверки содержат слова. В журнале они идут inline вместе с продавцом и оплатой и переносятся только при нехватке ширины. Обычный список подписывает реальную дату контекстом «Сегодня»/«Вчера» и согласует слово «чек» с количеством; исходная полная дата сохраняется в title, группа не вводит сумму дня. Поиск показывает found-count и «из 100 последних» на разных концах строки, затем плоские отфильтрованные чеки, без даты/неотфильтрованного day-count. Пустой query показывает помощь, кнопка clear скрыта через `:placeholder-shown`; clear использует SVG close. Чипы выбора периода/поиска — отдельные 44px элементы. Неизвестная сумма бонусов отображается «—»; метка не означает завершение операции.

### Cards / Containers

Белые карточки с внутренним контуром и padding из frontmatter. Итоги имеют светлую выручку, затем условный блок внимания, бонусы, сотрудников и топ-8 вкусов. Группы внимания подписаны «Взяли без оплаты · долг» и «Брак · списано»; подписи и summary используют уже отрисованные исходные значения/строки. «Весь брак» — белое контурное раскрытие со стрелкой, не новая финансовая формула. Полная native-подпись периода, включая «неполная», помещается переносом строк вместо ellipsis; диапазон и его полнота по-прежнему определяются исходным кодом.

Служебные строки журнала имеют тёплую поверхность. Выбранная карта имеет янтарную плашку, неподтверждённая — нейтральную недоступную поверхность. Камера — белый контейнер с тёмным окном по реализованной интеграции; готовый поток в QA синтетический. Loading сохраняет место hero/attention/следующей карточки скелетами (186/250/150px в текущем CSS); empty и network recovery имеют белый icon-chip, исходный текст и исходный retry-handler. Clear-search — светлая вторичная кнопка.

### Inputs / Fields

Прежние input/textarea с прежними ID переносятся целиком. Основное поле — светлое, фокус — белая поверхность и внутренний тёмный контур 2px; ошибка — красный контур. Поиск использует общий контур контейнера без второго контура input. Размеры, inputmode и guards сохраняются; оформление не корректирует введённую сумму автоматически.

Обычный раскрытый чек разделяет название/цену за единицу, исходные quantity-controls и сумму строки. Компактный акционный лист показывает количество отдельной inline-подписью и скрывает quantity-controls только в этом представлении. Подробный чек собирает состав в отдельный контейнер со строками минимум 32px и отдельным итогом; кнопка редактирования сохраняет высоту 52px без flex-сжатия. Открытие комментария переводит фокус и прокручивает textarea к нижнему видимому краю, сохраняя отдельный pinned total; headless focus/content не доказывает нативное перекрытие клавиатурой. Ввод УДАЛИТЬ сохраняет тёмный внутренний контур и маленький valid-check справа; checkbox имеет округлую опасную выбранную поверхность с vector-check. Deletion guard, checkbox и required reason определяются исходными handlers. Это описание текущего кода после корректировок, а не независимый visual PASS.

### Navigation

Одна нижняя навигация Касса / Журнал / Итоги. Используются прежние `.tab-btn` и `switchTab`, активность — `aria-current="page"`; переключатель режима — `aria-pressed`. При финансовой блокировке переход запрещён. Листы имеют `role="dialog"`, `aria-modal`, Escape, возврат фокуса и локальную Tab-петлю. Свайп заголовка вниз закрывает лист после смещения больше 60px.

Locked presentation приглушает grid, employee/mode и nav до opacity .45, сохраняя читаемую recovery CTA без повторного приглушения. Док скрыт под открытой камерой, QR регистрации и deletion layer, а также при определённой кодом клавиатуре. Финансовые guards продолжают действовать независимо от визуальной opacity.

### Catalogue / Counter

Основная область товара вызывает прежний `changeQty(name,1)`. Отдельный счётчик открывает «− / +» без изменения количества. Тап вне открытого stepper только закрывает его и ничего не добавляет. Одновременно открыт один stepper; idle закрытие — 4с. Undo хранится в памяти текущей страницы, отменяет количество через прежний handler и не меняет оплату/карту/комментарий. Единственный новый UI storage-key — `omoti_anikina_count_hint_v1`; показ hint через 600мс, до трёх раз, 4с, после открытия stepper больше не показывается. 600мс — задержка подсказки, не правило количества.

### Integration / Financial Boundaries

| Связь | DOM / слой C3.1 | Владелец данных и действия | Эталоны |
|---|---|---|---|
| Продавец | `c31-staff`, `c31-staff-sheet`, прежний `seller-row` | `setSeller`, remember/save sellers | KS-01, PY-05 |
| Количество и ассортимент | `flavors-grid`, tile hit/count/stepper, `cart-items` | `activeFlavors`, `changeQty`, `getPrice`, `effectivePrice`, bundle/hidden guards | KS, CT, WD, SY-03 |
| Чек/комментарий | `c31-cart-sheet`, `comment-input`, `total-sum/total-qty` | `updateCart`, quantity/bundle helpers | KS-04, PY-07, KB-02 |
| Оплата | `close-btn`, dock, `c31-more-sheet`, `mixed-*`, `self-clarify` | `PAY_TYPES`, `setPay`, `setSelfPay`, mixed validation | PY, SV, KB |
| Сохранение/очередь | тот же `close-btn`, queue badge, `server-mirror-status` | `closeCheck`, drafts, stable saleKey, retry/beacon/operation queue | KS-05…07, PY-06 |
| Карта/расчёт | `c31-card-sheet` с исходными `loyalty-*` | `AnikinaLoyalty`, connection/provider/server quote | LC |
| Unknown / сверка | `loyalty-pending`, `loyalty-correction-pending`, блокировка дока | durable identity, status/cancel и guards модулей | LC-08…11, JR-07…09 |
| Правка/удаление | подробный чек, `c31-confirm-sheet`, прежние `delete-*` | `CashierLoyaltyCorrections`, revision/check identity, delete guards | JR-03…09, KB-04/06 |
| QR | исходный registration dialog/channel/SVG | прежний registration QR module; показ без финансового запроса | LC-12 |
| Журнал/поиск | `journal-list`, detail, `c31-search-input` | `journalChecksWithQueue`, local filter; remote refresh прежний | JR, SR |
| Итоги/период | прежние `s-*`, stats/period/defects containers | `renderStatsSummary`, `loadStats`, existing period selectors | IT |
| Доступ/уведомления | исходные auth/notice/push nodes, point menu | device access, notices, existing retry/push handlers | SY-01/02/04 |

`interface.js` сохраняет ссылки на прежние handlers и добавляет представление/локальные guards. Цены, скидки, восемь способов оплаты, смешанная проверка, snapshots наборов, записи и retry принадлежат HTML и финансовым модулям. Сумма чека и к оплате показываются отдельно. Поиск работает только среди уже загруженных чеков; сумма дня не рассчитывается. Unknown-покупка не запускает повтор checkout; модульный отказ/ожидание не снимается дизайнерским слоем.

R2 делает повторные UI-lock присваивания идемпотентными: disabled ставится только при реальном изменении. Это прекращает MutationObserver-loop, не меняя финансовый отказ. Отказ auth блокирует закрытие уже существующего basket и новые товарные controls; после снятия auth вызывается исходный updateCart для восстановления guards. Когда модуль уже разрешил закрытие, due известен, ожидания/lock нет и это не correction, presentation возвращает готовую подпись «Закрыть чек»/«Сохранить изменения». Unknown, лимиты, disabled и purchase identity не переопределяются ради подписи.

Единственная предусмотренная правка финансового модуля — Anikina-only async confirmation `C31Confirm(message)` вместо `window.confirm`: тот же текст и boolean, cancel без записи. Текущая synthetic regression дополнительно подтверждает принятие: вызван исходный checkout ровно один раз, после подтверждения UI освобождается; это не настоящая бонусная покупка. Соседние кассы сохраняют native-confirm. Первичные namespace продавцов, очереди, устройства, кэша и бонусных pending/correction не заменяются; PIN, токены и клиентские данные в этой документации отсутствуют. Manifest, Service Worker, vendor и QR SVG не становятся объектом дизайн-правки.

### Icons / Motion

`interface.js` содержит inline SVG undo/card/receipt/journal/stats/search/reload/close/check/upload/warning: viewBox 24×24, stroke currentColor, ширина штриха 2.2, обычный размер 18–20px; дополнительные статусы используют 16/24/32px по месту. Back подробного чека — SVG chevron 16px со штрихом 2.6. Готовность, очередь, offline/reconciliation и ошибка имеют разные vector-иконки тоста; универсальная галочка успеха больше не подменяет семантику всех сообщений.

На Журнале тост стоит ниже header/actions (top 96px + safe-area), на остальных экранах — top 40px + safe-area. Пока Журнал активен и `.toast.show` виден, список сдвигается на `top: calc(96px + var(--c31-journal-notice-h,48px) + 8px)`. Высота `--c31-journal-notice-h` берётся из `toast.getBoundingClientRect().height`, отслеживается `ResizeObserver` с fallback на window resize; многострочный notice резервирует собственную реальную высоту. После исчезновения тоста CSS возвращает обычное положение списка. Исходный текст и lifetime сохраняются. QR остаётся настоящим исходным SVG. Никаких новых raster-материалов эта документация не создаёт.

Фактически есть tile press scale(.98)/120мс, dock transform/200мс, spinner 1с, toast 2с, stepper/hint 4с. `prefers-reduced-motion` отключает animation и transition. Токен времени листа 200мс объявлен, но самостоятельное появление sheet-анимацией в прочитанном коде не реализовано и не записано как доказанное поведение.

## Do's and Don'ts

### Do:

- Do брать визуальные значения и состояния из утверждённого C3.1, а финансовые тексты и доступность — из кода владельца.
- Do сохранять прежние ID, namespace, API и identity операций при переносе в листы и док.
- Do показывать отдельно количество, цену, сумму чека и к оплате; неизвестные бонусы показывать «—».
- Do различать локальную реализацию, проверку с фикстурами, deploy и проверку опубликованной кассы.
- Do сравнивать оригинальные PNG при одинаковом viewport и сохранять реальные мобильные проверки как отдельный этап.

### Don't:

- Don't распространять C3.1 на Советскую, Новогоднюю или общую ERP без отдельной задачи.
- Don't подменять статусы/лимиты/цены фиктивными значениями ради совпадения с макетом.
- Don't повторять unknown-бонусную покупку или очищать pending/recovery state через дизайн-слой.
- Don't считать browser mocks доказательством реальных денег, нативной клавиатуры, камеры или safe-area.
- Don't считать этот DESIGN.md, диагностический R2 или числовой pixel diff приёмкой всех 71 состояний.

Not canonized: R2 заменил основные close/check/reload/toast/search-clear/period/back glyph-иконки на inline SVG; остаточный текстовый знак warning-title не становится новым правилом компонентов. Утверждённые заголовки карточек и служебная лента сохраняют приоритет владельца. Документ описывает исправления локального кандидата после `PUBLISHED_AUDIT_R1`, но не объявляет их public acceptance без нового immutable public run и независимого verdict. Расхождения не узакониваются записью в документации; физическая клавиатура, камера и safe-area остаются открытыми проверками.
