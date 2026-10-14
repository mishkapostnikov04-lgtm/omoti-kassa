---
name: "OMOTI · Касса Аникина · C «Пульт» 3.1"
description: "Документация локальной реализации утверждённого C3.1; только касса Аникиной."
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

Срез документации: 14.10.2026, до deploy. Исходная Pages/main ревизия — `5c9eb685ac734bd832ae7c8771e6336eed948fd7`; сверка и сохранённые исходники записаны в [BASELINE.json](../../_local_artifacts/cashier-anikina-c31-20261014/BASELINE.json). Основание записи — [interface.js](interface.js), [integration.css](integration.css), [tokens.css](tokens.css), [components.css](components.css), [карта функций](../../_local_artifacts/cashier-anikina-c31-20261014/FUNCTION_MAP.md) и [контракт поверхности](../../_local_artifacts/cashier-anikina-c31-20261014/SURFACE_BRIEF.md). Идентичность прочитанного кода сохранена в sidecar.

Локальная реализация не означает приёмку 71 состояния или публикацию. [R1](../../_local_artifacts/cashier-anikina-c31-20261014/FINISH_REVIEW_R1.md) и [R2](../../_local_artifacts/cashier-anikina-c31-20261014/FINISH_REVIEW_R2.md) — диагностические reviews; R2 требует новой съёмки после исправлений. [REGRESSION.json](../../_local_artifacts/cashier-anikina-c31-20261014/REGRESSION.json) фиксирует 19 синтетических групп и `realWrites: 0`; это не проверка реальных покупок. Все финансовые browser-прогоны используют полные mocks `orders.omoti.ru`, Service Worker блокируется. Нативная клавиатура iPhone/Android, реальная камера, safe-area и поведение Safari/PWA на устройстве не проверены. Deploy и проверка опубликованной C3.1 на момент этой записи не выполнены.

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

Метки очереди, акции, карты, правки и сверки содержат слова. Чипы выбора периода/поиска — отдельные 44px элементы. Неизвестная сумма бонусов отображается «—»; метка не означает завершение операции.

### Cards / Containers

Белые карточки с внутренним контуром и padding из frontmatter. Итоги имеют светлую выручку, затем условный блок внимания, бонусы, сотрудников и топ-8 вкусов. Служебные строки журнала имеют тёплую поверхность. Выбранная карта имеет янтарную плашку, неподтверждённая — нейтральную недоступную поверхность. Камера — белый контейнер с тёмным окном по реализованной интеграции; готовый поток в QA синтетический.

### Inputs / Fields

Прежние input/textarea с прежними ID переносятся целиком. Основное поле — светлое, фокус — белая поверхность и внутренний тёмный контур 2px; ошибка — красный контур. Поиск использует общий контур контейнера без второго контура input. Размеры, inputmode и guards сохраняются; оформление не корректирует введённую сумму автоматически.

Обычный раскрытый чек разделяет название/цену за единицу, исходные quantity-controls и сумму строки. Компактный акционный лист показывает количество отдельной inline-подписью и скрывает quantity-controls только в этом представлении. Подробный чек собирает состав в отдельный контейнер со строками минимум 32px и отдельным итогом; кнопка редактирования сохраняет высоту 52px без flex-сжатия. Это описание текущего кода после корректировок, а не независимый visual PASS.

### Navigation

Одна нижняя навигация Касса / Журнал / Итоги. Используются прежние `.tab-btn` и `switchTab`, активность — `aria-current="page"`; переключатель режима — `aria-pressed`. При финансовой блокировке переход запрещён. Листы имеют `role="dialog"`, `aria-modal`, Escape, возврат фокуса и локальную Tab-петлю. Свайп заголовка вниз закрывает лист после смещения больше 60px.

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

Единственная предусмотренная правка финансового модуля — Anikina-only async confirmation `C31Confirm(message)` вместо `window.confirm`: тот же текст и boolean, cancel без записи. Соседние кассы сохраняют native-confirm. Первичные namespace продавцов, очереди, устройства, кэша и бонусных pending/correction не заменяются; PIN, токены и клиентские данные в этой документации отсутствуют. Manifest, Service Worker, vendor и QR SVG не становятся объектом дизайн-правки.

### Icons / Motion

`interface.js` содержит inline SVG undo/card/receipt/journal/stats/search: viewBox 24×24, stroke currentColor, ширина штриха 2.2, обычный размер 18–20px; пустые/ошибочные состояния используют 32px. QR остаётся настоящим исходным SVG. Никаких новых raster-материалов эта документация не создаёт.

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

Not canonized: оставшиеся текстовые glyph-иконки (✕, ✓, !, ‹/▾) в текущем адаптере фиксируются как долг реализации inline SVG, а не как правило новых компонентов. Утверждённые заголовки карточек и служебная лента сохраняют приоритет владельца. Расхождения R1/R2 не объявлены устранёнными без новой immutable съёмки; документирование их не исправляет и не узаконивает.
