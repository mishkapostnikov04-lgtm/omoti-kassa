---
name: "OMOTI · Касса Аникина · C3.2 «Тише» Б + Итоги A «Отчёт-лента»"
description: "C3.2 «Тише» Б сохранён; Итоги A R1 опубликованы, public review fix; геометрия R2 исправлена локально, ещё не опубликована."
colors:
  bg: "#F6F5F1"
  tile: "#EBE9E3"
  pill: "#ECEAE4"
  field: "#F3F2EE"
  faint: "#9C9A93"
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
  amber-tile: "#FFF3DC"
  amber-tint: "#FFF5E3"
  amber-soft-line: "#F2C77A"
  amber-text: "#7A4300"
  amber-flash: "rgba(255,162,26,.28)"
  danger: "#C2410C"
  danger-2: "#D9480F"
  danger-text: "#B4400C"
  danger-tint: "#FFF1EA"
  danger-tint-2: "#FFEDE4"
  danger-line: "#F2B79A"
  brak-tile: "#FBEDE7"
  brak-line: "#E7A88A"
  brak-count: "#3B3A36"
  dock-btn: "#262624"
  dock-line: "#2A2A28"
  dock-text: "#F2F1EC"
  dock-sub-text: "#C9C7C0"
  dock-muted: "#8E8C86"
  dock-off: "#5F5E59"
  dock-off-bg: "#33322F"
  dock-wait-bg: "#6B4A12"
  dock-wait-text: "#FFE2B0"
  dock-brak: "#FF8F66"
  scrim: "rgba(18,18,18,.34)"
  itogi-track: "#EFEDE7"
  itogi-problem-hint: "#8A5A48"
  itogi-warning-ink: "#4A3000"
  itogi-scroll-shadow: "rgba(0,0,0,.18)"
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
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.08
  check:
    fontSize: "14.5px"
    fontWeight: 700
  seller:
    fontSize: "14px"
    fontWeight: 700
  menu:
    fontSize: "15.5px"
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
  itogi-section-title:
    fontSize: "15px"
    fontWeight: 700
  itogi-summary:
    fontSize: "13px"
    fontWeight: 600
  itogi-caption:
    fontSize: "13px"
  itogi-label:
    fontSize: "12px"
    lineHeight: 1.25
  itogi-meta:
    fontSize: "12.5px"
    fontWeight: 600
  itogi-note:
    fontSize: "12.5px"
    lineHeight: 1.4
  itogi-extra:
    fontSize: "11.5px"
  itogi-quantity:
    fontSize: "13.5px"
  itogi-kpi:
    fontSize: "19px"
    fontWeight: 800
    letterSpacing: "-0.01em"
  itogi-narrow-display:
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  itogi-narrow-kpi:
    fontSize: "17px"
    fontWeight: 800
rounded:
  count: "9px"
  done: "12px"
  icon-button: "13px"
  button: "14px"
  sheet-button: "15px"
  tile: "14px"
  card: "18px"
  sheet: "22px"
  modal: "28px"
  itogi-section: "20px"
  itogi-track: "3px"
  itogi-focus: "10px"
  itogi-pill: "999px"
spacing:
  gap: "6px"
  sheet-gap: "8px"
  dock-x: "10px"
  gutter: "12px"
  dock-bottom: "16px"
  itogi-gap: "10px"
  itogi-card-x: "16px"
  itogi-card-y: "14px"
  itogi-list-bottom: "20px"
  itogi-period-gap: "2px"
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
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet-button}"
    height: "48px"
    width: "100%"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.input}"
    rounded: "{rounded.button}"
    padding: "0 14px"
    height: "52px"
    width: "100%"
  tile:
    backgroundColor: "{colors.tile}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    padding: "7px 10px 8px"
    height: "70px"
  tile-selected:
    backgroundColor: "{colors.amber-tile}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    height: "70px"
  counter:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    typography: "{typography.count}"
    rounded: "{rounded.count}"
    width: "32px"
    height: "28px"
  check-button:
    backgroundColor: "{colors.dock-text}"
    textColor: "{colors.ink}"
    typography: "{typography.check}"
    rounded: "{rounded.icon-button}"
    height: "44px"
  close-button-self:
    backgroundColor: "{colors.dock-text}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    height: "48px"
  close-button-brak:
    backgroundColor: "{colors.dock-btn}"
    textColor: "{colors.dock-brak}"
    rounded: "{rounded.button}"
    height: "48px"
  itogi-section:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.itogi-section}"
    padding: "14px 16px"
  itogi-section-closed:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.itogi-section}"
    padding: "12px 16px"
    height: "56px"
  itogi-period:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0 10px 0 14px"
    height: "44px"
  itogi-problem-chip:
    backgroundColor: "{colors.brak-tile}"
    textColor: "{colors.danger-text}"
    rounded: "{rounded.count}"
    padding: "0 10px"
    height: "28px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "12px 14px"
---

# Design System: OMOTI · Касса Аникина · C3.2 «Тише» Б + Итоги A «Отчёт-лента»

## Overview

**Creative North Star: "Тише C3.2 · вариант Б; Итоги A «Отчёт-лента»"**

Это запись фактической локальной реализации утверждённого владельцем C3.2 «Тише», вариант Б, только для кассы Аникиной. Одна верхняя строка объединяет точку и продавца. Нейтральные плитки без цен и обычных рамок оставляют видимыми имя и количество; тёмный док показывает строки чека с первым товаром. Служебные действия находятся в «Ещё», Журнал собирает чеки дня в спокойные белые группы. Только Итоги заменены утверждённым вариантом A «Отчёт-лента»: пять последовательных белых разделов с независимым раскрытием, готовыми сводками и запоминанием на телефоне.

Источник вида и движения — неизменяемый [addon C3.2](../../_local_artifacts/cashier-anikina-c32-20261014/package/omoti-kassa-c32-handoff-addon/HANDOFF.md), его prototype, tokens/components/motion и 49 PNG. Он дополняет [C3.1](../../design-system/modules/cashier-anikina/c31-approved-20261014/HANDOFF.md). Приоритет: работающие финансовые функции и C3.1 `PRESERVE.md`; prototype и design-system C3.2; PNG конкретного состояния; документы addon; C3.1 для незатронутого. Имена, ассортимент, цены, даты, суммы, доступность и тексты состояний остаются данными исходного кода/сервера. Этот документ описывает реализацию и не заменяет [единый регламент](../../OMOTI_WORK_REGULATION.md), общую ERP DS v1.0.0 или стандарты двух других касс.

**Key Characteristics:**

- Одна верхняя строка; продавец в плашке с аватаром.
- Geologica, табличные цифры и три колонки нейтральных плиток без цен.
- Пустой док содержит только Касса / Журнал / Итоги.
- Девять утверждённых эффектов C3.2, без ожидания на пути касаний.
- Стабильные DOM-плитки и отступы от измеренной высоты дока.
- Прежние финансовые владельцы, ID, API и namespace.

### Current Итоги A R2 · 15.10.2026 · локальная документация

**Изменено локально; R2 ещё не опубликован.** Новый build `c32-itogi-20261014-r2` и query integration.css?v=R2 относятся к текущему кандидату. itogi.css, itogi.js и interface.js сохраняют R1 содержимое/query. Fresh raw/canonical-LF identity девяти исходников находится в sidecar; изменились только HTML metadata/query и integration.css, прежние семь runtime SHA exact. HTML содержит186CRLF, raw и canonical LF остаются разными. [local-r2-final/report.json](../../_local_artifacts/cashier-anikina-itogi-c32-20261014/local-r2-final/report.json) содержит все28 actual pairs с единой frozen identity; это captures, отдельный visual verdict R2 не подменяется документацией.

Опубликованный Итоги A R1 — commit `507a737d6053b0c3b505f99803772b18ae09579d`, Pages built `2026-10-14T17:02:43Z` /15.10.2026 00:02:43+07. [PUBLIC_R1](../../_local_artifacts/cashier-anikina-itogi-c32-20261014/PUBLIC_R1.json) фиксирует23ресурса/46ordinary+fresh exact SHA; published-r1/EVIDENCE —11public QA PASS, финансовое сравнение14 fixtures. Полный независимый [PUBLISHED_VISUAL_REVIEW](../../_local_artifacts/cashier-anikina-itogi-c32-20261014/PUBLISHED_VISUAL_REVIEW.md) просмотрел все28 publicpairs и дал **fix**, F1/F2; локальный прежний ship F1–F4 не является public acceptance. R1 snapshot сохранён ниже и в extensions.itogiR1History.

R2 устраняет два строгих геометрических расхождения scoped aliases: F1 — native sheet body gap10 перед wrapper и отсутствие межстрочных gap2 давали накопленные смещения8/6/4/2px; approvedprototype помещает сегменты/пункты напрямую в flex-column sheet с gap2. Adapter сохраняет wrapper/ownernodes, поэтому `#c31-period-sheet.k-itogi-period .k-sheet__body{gap:2px}` и `.period-dropdown-menu{display:flex;flex-direction:column;gap:2px}` восстанавливают тот же ритм. F2 — native `.ss-amount{min-width:80px}` расширяло auto-column и уводило debt quantity на27px влево; `.k-stats .k-srow .ss-amount{min-width:0}` возвращает intrinsic-width auto-column approvedCSS. Суммы/количество/тексты/сортировка/handlers прежние. `spacing.itogi-period-gap` — точное значение approvedprototype, не новая шкала или новый вариант.

[Свежий SOURCE_PRESERVATION](../../_local_artifacts/cashier-anikina-itogi-c32-20261014/SOURCE_PRESERVATION.json) снова PASS:39protected files/425retained CSS rules/2native programs exact. sealed itogi.css SHA0c91e243b404e4bb5a955fcaf01f02903c32c097fa10fc50dccb080017086956 прежний. Финансовые/data/API/nativeperiod/bonus владельцы не изменились; R2 presentation-only. Другие кассы/Касса/Журнал/меню/C3.2 motion/tokens прежние. Physical iPhone scroll и реальные Safari/PWA/клавиатура/камера/permissions по-прежнему **OPEN**.

### Preserved Итоги A R1 · 14.10.2026 · локальный snapshot

Историческая запись до публикации R1 сохранена. Её «ещё не опубликован» и dd7 относятся к моменту документирования; текущий R1 public status и R2 candidate указаны выше.

Текущий визуальный источник только Итогов — [CODEX-PROMPT](../../_local_artifacts/cashier-anikina-itogi-c32-20261014/package/omoti-kassa-c32-itogi-addon/CODEX-PROMPT.md), [HANDOFF](../../_local_artifacts/cashier-anikina-itogi-c32-20261014/package/omoti-kassa-c32-itogi-addon/HANDOFF.md), INTERACTIONS, DATA-MAP, SCREENS, QA, prototype и sealed [itogi.css](../../_local_artifacts/cashier-anikina-itogi-c32-20261014/package/omoti-kassa-c32-itogi-addon/design-system/itogi.css). SHA точного CSS: `0c91e243b404e4bb5a955fcaf01f02903c32c097fa10fc50dccb080017086956`. Пакет заменяет C3.2 stats.css/I2-01…03/INTERACTIONS §6/CHANGES §8 и прежний foldStatsCard, а C3.1 IT-01/02/04/07 — новыми ST-01…18/SW-01…10. IT-03/05/06 сохраняют содержание. Касса, Журнал, меню точки, токены, док и движение C3.2 Б прежние. Новый документ не является глобальным стандартом. PRODUCT.md отсутствует; продуктовые обязательства не выдуманы.

**Изменено локально и проверено локально; новый Итоги A ещё не развёрнут и не проверен на публичной кассе.** Последний [VISUAL_VERDICT_LOCAL_FINAL](../../_local_artifacts/cashier-anikina-itogi-c32-20261014/VISUAL_VERDICT_LOCAL_FINAL.md) даёт ship только исправлениям F1–F4 и их регрессиям: reviewer самостоятельно просмотрел все 28 actual pair PNG в local-review-final. Это bounded local verdict, не полная production-приёмка. Один frozen raw SHA пяти runtime-файлов совпадает во всех captures; sidecar содержит raw и canonical LF для девяти текущих source-файлов. HTML содержит 186 CRLF: raw capture SHA и SHA нормализованных LF различаются; они не взаимозаменяемы. Текущая публикация до этой задачи — dd7e644; новый deploy этим документом не заявляется.

[DATA_MAP](../../_local_artifacts/cashier-anikina-itogi-c32-20261014/DATA_MAP.md) и [SOURCE_PRESERVATION](../../_local_artifacts/cashier-anikina-itogi-c32-20261014/SOURCE_PRESERVATION.json) фиксируют прежние финансовые владельцы: 39 защищённых файлов, 425 оставленных CSS-правил, два native inline script exact. Financial parity 14 fixtures и interaction evidence принадлежат локальным отчётам задачи; эта документация их не запускает повторно. Physical iPhone scroll — **OPEN**, нативные клавиатура/камера/Safari/PWA/permissions не получают PASS от mocks. Новых shipping raster нет; новые иконки — native inline SVG. 28 sealed PNG — эталоны, captures — evidence.

### Preserved C3.2 R2 documentation snapshot

Историческая запись ниже сохранена дословно; её pending-статус описывает момент прежнего документирования. Последующая публикация R2 dd7e644 подтверждена модульным реестром; новый addon Итогов заменяет только старое presentation/fold поведение.

**Текущий статус C3.2 R2 (`c32-20261014-r2`): изменено локально; проверки и публикация ещё выполняются.** Это продолжение опубликованного R1 с явным уточнением владельца от 14.10.2026. Актуальные release-состояние и результаты принадлежат внешним [REPORT](../../_local_artifacts/cashier-anikina-c32-20261014/REPORT.md) и [STATE_MAP](../../_local_artifacts/cashier-anikina-c32-20261014/STATE_MAP.md); их R1 evidence не является приёмкой R2. Источники — [interface.js](interface.js), [integration.css](integration.css), [tokens.css](tokens.css), [components.css](components.css), [motion.css](motion.css), [motion.js](motion.js) и [omoti_anikina.html](../omoti_anikina.html). Семь текущих локальных SHA сохранены в sidecar; это snapshot на момент документирования, не deployed hash.

### Preserved Owner exception · 14.10.2026 · C3.2 R2

**Retired только в новых Итогах A:** приведённая owner annotation остаётся историей; вместо foldStatsCard теперь пять persistent .k-sec. Остальные решения C3.2 R2 сохраняются.

Владелец явно уточнил после публикации C3.2 R1: в Итогах **«Топ вкусов» и «Требует внимания» свёрнуты по умолчанию и раскрываются независимо нажатием на свой заголовок**. Это исключение только для Аникиной поверх sealed C3.2; утверждённые tokens/components/motion и исходные эталоны не перезаписываются.

Реализация `foldStatsCard` переносит существующий заголовок в кнопку с `aria-expanded`/`aria-controls`, а прежние native дочерние блоки — в скрываемый body. Начальное состояние обоих body — `hidden=true`. Заголовок имеет область не меньше 44px, прежний title и SVG-chevron; раскрытие поворачивает chevron на 180°. Каждый toggle меняет только своё body и `aria-expanded`; оба блока можно открыть одновременно. Выбор хранится только в текущем view, без нового localStorage/API. Native renderer, строки вкусов, долг/брак, значения, действия и условная видимость карточки внимания сохраняются; вычисления не меняются.

**Проверка R2 ожидается.** Предусмотрены [local-fold-r2/folded-stats/report.json](../../_local_artifacts/cashier-anikina-c32-20261014/local-fold-r2/folded-stats/report.json) и [published-fold-r2/folded-stats/report.json](../../_local_artifacts/cashier-anikina-c32-20261014/published-fold-r2/folded-stats/report.json). На момент этой записи оба являются ожидаемыми путями будущих отчётов; ссылки не означают наличие файла или PASS. Проверить начальное свёрнутое состояние, независимое раскрытие заголовками, сохранение native данных и повторную опубликованную версию. Physical iPhone scrolling остаётся OPEN.

### Preserved C3.2 R1 evidence

Ниже сохранён исходный локальный evidence snapshot до первой публикации. Последующая публикация R1 подтверждена внешними REPORT/STATE_MAP и относится к R1; она не подтверждает новое owner exception R2.

[EXTENDED-local-final](../../_local_artifacts/cashier-anikina-c32-20261014/EXTENDED-local-final.json) фиксирует синтетические проверки исходных программ/защищённых файлов, exact approved assets, исходов сохранения, движения и измеренной геометрии; `realWrites: 0`. [Первый независимый локальный review](../../_local_artifacts/cashier-anikina-c32-20261014/VISUAL_REVIEW_LOCAL_R1.md) просмотрел 49 пар и дал `fix` (F1–F6, E1–E3); последующие изменения не получают visual PASS только из этой записи. [Windows WebKit](../../_local_artifacts/cashier-anikina-c32-20261014/WEBKIT-local-final.json) сохраняет подключённую цель и проходит 20 программных scroll/update циклов, но реальное залипание iPhone не воспроизведено и не доказано исправленным. **Physical iPhone scrolling: OPEN**; нативная клавиатура, камера, safe-area, Safari/PWA и permissions также не получают PASS от mocks. Автотесты mock все запросы `orders.omoti.ru` и блокируют Service Worker.

### Preserved C3.1 R2 history

Следующие записи и inventory относятся к C3.1 до C3.2. Их SHA, captures и public verdict сохранены как история; они не подтверждают публикацию или приёмку C3.2.

Срез реализации: R2 от 14.10.2026 непосредственно перед вторым deploy; status candidate в документах релизного Git commit — историческая отметка этого снимка. Исходная Pages/main ревизия — `5c9eb685ac734bd832ae7c8771e6336eed948fd7`; сверка и сохранённые исходники записаны в [BASELINE.json](../../_local_artifacts/cashier-anikina-c31-20261014/BASELINE.json). Основание записи — [interface.js](interface.js), [integration.css](integration.css), [tokens.css](tokens.css), [components.css](components.css), [карта функций](../../_local_artifacts/cashier-anikina-c31-20261014/FUNCTION_MAP.md) и [контракт поверхности](../../_local_artifacts/cashier-anikina-c31-20261014/SURFACE_BRIEF.md). Идентичность прочитанного локального кода сохранена в sidecar. API/backend и владельцы финансовых расчётов этим presentation-пакетом не заменяются.

Первый опубликованный выпуск — commit `e6f7efbd8afdabf29885ca5fff05532e8b9e96d8`, build 14.10.2026 08:36:10 UTC. [PUBLISHED_AUDIT_R1.md](../../_local_artifacts/cashier-anikina-c31-20261014/PUBLISHED_AUDIT_R1.md) относится именно к нему и имеет `disposition: fix`: сверены оригинальные 71 base-состояния и 15 дополнительных сравнений, а не все 213 кадров глазами. Зафиксированы 213 captures, отсутствие runtime errors/missing fixtures/horizontal overflow и 38 совпадающих ответов по [served-assets manifest](../../_local_artifacts/cashier-anikina-c31-20261014/PUBLISHED_ASSETS-1791967035124.json). Этот аудит не принимает более новый локальный R2. Windows raw SHA и SHA опубликованных Git/LF-байтов различаются у CRLF-файлов; served-версия доказывается отдельным manifest, а не локальным hash.

**Отметка после публикации, 14.10.2026.** R2 опубликован: commit `12410cd9e11ccb7c8e87fcecfdb1c3081491bd18`, build `built` от `2026-10-14T09:41:27Z`. [Отчёт](../../_local_artifacts/cashier-anikina-c31-20261014/REPORT.md), [карта состояний](../../_local_artifacts/cashier-anikina-c31-20261014/STATE_MAP.md) и [FINAL_EVIDENCE](../../_local_artifacts/cashier-anikina-c31-20261014/FINAL_EVIDENCE.json) фиксируют 25 публичных синтетических групп PASS, 213 captures и просмотр независимым reviewer всех 213 пар: восемь групп исправлены. 38 asset SHA совпали; повторная публичная сверка совпала. [INLINE_CONTRACT](../../_local_artifacts/cashier-anikina-c31-20261014/INLINE_CONTRACT.json) подтверждает сохранность двух native inline-программ после LF-нормализации, кроме согласованной cache query-version зависимости в retry loader. Эта локальная annotation сделана после deploy, не опубликована отдельно и не меняет runtime/code SHA; файлы в Git R2 остаются снимком до публикации.

Ни документирование, ни `captured-needs-visual-review`, ни scalar diffRatio сами по себе не означают visual acceptance; её основание — независимый public review. Нативная клавиатура iPhone/Android, реальная камера, safe-area, Safari/PWA и ветви permissions на устройствах не проверены. Все финансовые browser-прогоны используют синтетические mocks всех запросов `orders.omoti.ru`, Service Worker блокируется; реальных чеков, бонусных операций и регистрации устройств ради проверки не было.

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

Палитра frontmatter извлечена из утверждённого C3.2 `tokens.css` и точного sealed `itogi.css`; ключи совпадают с суффиксами `--k-*`. Значения C3.1, заменённые addon, не применяются как текущие.

### Primary

- `amber` — счётчик, продажная CTA и плашка «Кто продаёт?» без выбранного имени.
- `amber-line`, `amber-tile` — рамка и поверхность выбранного товара; `amber-flash` — краткая подсветка суммы.
- `amber-tint`, `amber-soft-line`, `amber-text` — сохранённые информационные и бонусные поверхности, текст «+1».

### Secondary

- `danger*` — ошибка, скрытый товар, опасное действие и состояние сверки.
- `brak-tile`, `brak-line`, `brak-count` — только выбранные плитки брака; экран не перекрашивается.
- `dock-brak` — текст и контур тёмной кнопки списания.

### Neutral

- `bg` — фон экрана; `tile` — обычная плитка без рамки; `pill` — продавец; `field` — поля и вторичные кнопки.
- `surface`, `line`, `line-soft`, `chip` — белые группы/листы, контуры состояний и разделители.
- `ink*`, `muted*`, `faint` — иерархия текста.
- `dock-*` — тёмный док, светлая кнопка чека/записи «себе», ожидание и disabled.
- `scrim` — затемнение открытого листа; док получает собственное затемнение.
- `itogi-track` — тихая дорожка полос; заполнение использует прежний `ink-2`. `itogi-problem-hint` — разделитель чипа, `itogi-warning-ink` — текст заметки ожидания; `itogi-scroll-shadow` — тень закреплённой шапки при scroll. Это точные pinned значения, не новая палитра. Проблемные число/чип используют `danger-text`/`brak-tile`, точка — `danger-2`; текущая метка периода использует `amber-tile`/`amber-text`.

**The State Color Rule.** Цвет подтверждает состояние из финансового владельца; оформление не создаёт статус, доступный баланс или разрешение на повтор операции.

## Typography

**Display Font:** Geologica с запасным стеком из frontmatter. **Body Font:** тот же стек. Отдельного моноширинного шрифта нет.

`integration.css` подключает локальные TTF `geologica-400.ttf`…`geologica-800.ttf` через пять `@font-face` с `font-display: swap`. [OFL.txt](OFL.txt) хранится рядом. Внешняя загрузка Google Fonts для этой реализации не нужна. На корне включены `font-variant-numeric: tabular-nums`.

### Hierarchy

- Display — сумма выручки в светлой карточке итогов.
- Headline — «Журнал» и «Итоги».
- Title — заголовок рабочего листа; подтверждение/удаление используют более крупный заголовок (21px/800).
- Body — обычный текст; подписи преимущественно 12–12.5px, микро 11px.
- Tile — двухстрочное название без цены на плитке. Цена остаётся в исходных расчётах и строках листа чека. Check — подпись светлой кнопки «Чек · N»; Seller — имя продавца; Menu — пункты оплаты и выбора сотрудника.
- Count, Dock Sum и Close Button — устойчивые цифры количества, сумма и главное действие.
- Input и Money Input — поля не меньше 16px; суммы 20px/700. В смешанной оплате поле выровнено влево и имеет отдельный суффикс ₽; поле бонусов остаётся выровненным вправо.

Насыщенность и размеры frontmatter фиксируют реально используемые роли. В режиме «− / +» имя занимает одну строку с многоточием (12.5px/15px), обычная плитка — до двух строк. Денежные подписи не превращаются в новые финансовые данные.

Итоги A используют роли `itogi-*` frontmatter: заголовок раздела, summary, метки, заметки, extra-quantity и KPI. Название периода использует check (14.5px/700), пункт периода menu (15.5px/700), штатная строка проблемы check-size с обычным весом, имя 600 и значение 700. На ширине ≤340px display и KPI переходят на narrow-роли; другие экраны сохраняют C3.2 scale.

**The Numeric Roles Rule.** Количество, цена за единицу, сумма строки, сумма чека и к оплате остаются отдельными значениями с отдельной иерархией.

## Layout

Корень — `100dvh`, максимальная ширина 480px, по центру. `html/body` имеют `height:100%`, `overflow:hidden`, `overscroll-behavior:none`. Верхняя строка кассы начинается на 8px + safe-area-top, имеет 44px высоты; базовый верх сетки 60px. Edit и настоящие notice добавляются в flex-поток. Три колонки `repeat(3,minmax(0,1fr))`, товар 70px; поля и промежутки — из frontmatter.

Док измеряется `ResizeObserver`: `Math.round(dock.getBoundingClientRect().height)` пишет `--k-current-dock` на app и `:root`, включая выезд строк. Низ `max(16px, safe-area-bottom − 10px)`. При нулевой safe-area ожидаются 64px пустой док/Журнал/Итоги,174px чек,224px «Себе оплачено»,216px «Себе без оплаты»/«Брак»; при simulated34px —72/182/232/224px. Это проверки эмуляции, а не измерения физического iPhone. Сетка имеет запас actual dock +32px; fade 24px, последний ряд остаётся выше него.

Обычные листы: поля 8px, максимальная ширина 464px, низ actual dock +8px; max-height `100dvh − actual dock − 8px − safe-area-top − 52px`. Лист продавца расположен над навигацией: `64px − 16px + dock-pad-bottom + 8px`. Середина листа, Журнал, открытый чек и Итоги имеют `overflow-y:auto`, `overscroll-behavior:contain`, `touch-action:pan-y`. Низ списков привязан к actual dock.

Плитки обновляются на месте по имени. Изменение набора вкусов откладывается, пока касание активно или после scroll прошло меньше 150мс; settle timer155мс и `scrollend` проверяют завершение. Перерисовка состояния не присваивает `scrollTop`. Закрытые листы имеют `inert`, `visibility:hidden`, `pointer-events:none`; fly/flash/fade/hint не перехватывают касания. Диагностика `?qa=scroll` временно пишет последние 200 неперсональных scroll/touch событий в `sessionStorage` и показывает «Журнал прокрутки»; без флага выключена. Удаление диагностики — после физического подтверждения отдельным коммитом. Коренная причина реального iPhone freeze остаётся OPEN.

Итоги A: одна прокрутка от `96px + --k-safe-t` до измеренного `--k-current-dock` (fallback `--k-dock-nav-only-h`), поля списка `2px / --k-gutter / 20px`, gap — `itogi-gap`. Ни таблица, ни заметка не вводит nested scroll. `.is-scrolled` включается при scrollTop >2. При раскрытии сохраняется scrollTop, при native смене периода сбрасывается в 0. Шапка: cover z3, point/head z4, scroll z1; док прежний.

Клавиатура сохраняет C3.1 контракт: `--k-kb-h = max(0, innerHeight − visualViewport.height − visualViewport.offsetTop)`; текстовый input/textarea и overlap >100px включают `is-kb-open`. Док скрывается, лист находится на keyboard +8px; пересчёт на visualViewport resize/scroll и focusin/out. «Готово» закрывает фокус, Enter поиска убирает клавиатуру. Нативная клавиатура не проверена.

## Elevation & Depth

Обычные плитки и новые разделы Итогов плоские и без рамок. Выбранная плитка получает внутренний контур; прежние карточки ожидания других поверхностей сохраняют контур состояния. Итоги A убирают янтарную полосу выручки и розовый фон/красную рамку attention; янтарные плитки бонусов заменены плоскими KPI, толстые чёрные полосы — тонкими дорожками. Белые группы Журнала разделяются тонкими линиями, тёмный док задаёт нижний уровень.

Листы и тост используют утверждённые тени. Локальная интеграция: dock z-index6, sheet8, scrim5; confirm86 над scrim84; toast90 и скрывается под confirm. При открытом листе dock `::after` затемняется `scrim`; это представление, а не финансовый lock.

### Shadow Vocabulary

- Sheet — `0 20px 50px -20px rgba(0,0,0,.45)`.
- Toast — `0 0 0 1px var(--k-line), 0 14px 30px -10px rgba(0,0,0,.25)`.
- Hint — `0 10px 24px -8px rgba(0,0,0,.45)`.
- Modal — `0 -10px 40px rgba(0,0,0,.25)`.
- Итоги scrolled header — `0 1px 0 var(--k-line),0 10px 14px -12px rgba(0,0,0,.18)`; только при scrollTop >2.

## Shapes

Радиусы frontmatter отражают счётчик, кнопки, товары, карточки, листы и модальные окна. Повторяется мягкая прямоугольная форма. Док имеет верхние углы 28px. Кнопки «− / +» на плитке — 40–44×44px; видимый счётчик — 32×28px, псевдоэлемент расширяет касание до 50×44px. Расширенная зона не меняет видимый размер счётчика.

## Components

### Buttons

Продажная CTA — янтарная 48px; запись «себе» — светлая с тёмным текстом; брак — тёмная с контуром 1.5px и текстом `dock-brak`. Disabled/wait принадлежат исходному владельцу; saving оставляет одну CTA со spinner и `aria-busy`. Без продавца способы оплаты используют `aria-disabled=true`: тап встряхивает «Кто продаёт?», оплату не выбирает.

Светлая «Чек · N моти»44px содержит отдельный inline-block счётчик, карта доступна с первым товаром. Undo44×44 перенесена в шапку чека рядом с «+ Комментарий». «Готово»44px закрывает лист чека; комментарий и итог сохраняют прежние действия. «Ещё» содержит Яндекс/смешанную и отдельную группу «СЕБЕ И БРАК · НЕ В ВЫРУЧКУ». С выбранной картой четвёртая оплата — «Смешанная».

Кнопки листов: тёмная 52px, светлая 48px, янтарная 52px; опасная контурная 44px отдельно от редактирования. Focus-visible — янтарный контур 2px с offset3px; новой hover-палитры нет.

### Chips

Журнал содержит две строки в белой группе дня: №/время/метки и сумма, затем продавец/оплата и количество. Вкусы и перечёркнутая сумма в списке отсутствуют. Карта — нейтральная иконка и маска; правка/акция — тихий текст. Очередь и сверка сохраняют статусные метки. Служебный чек имеет обычную поверхность и словесную метку; брак — отдельную мягкую метку.

Количество берётся из `CashierReceiptDetails.quantityLabel`, включая мункейки. Даты — реальные «Сегодня»/«Вчера» и корректный plural; дневной итог не вводится. Поиск остаётся среди загруженных последних 100 чеков; found-count и scope разделены, результаты в одной подложке. Empty query/clear/Enter сохраняют прежнее поведение. Неизвестные бонусы показывают «—».

### Cards / Containers

Белые карточки C3.2 Б других поверхностей сохраняют прежнюю форму. В Итогах A ровно пять разделов: results «Выручка», условный attention «Требует внимания», bonus «Бонусы за период», staff «По сотрудникам», top «Топ вкусов». Defaults: results/bonus/staff раскрыты, attention/top закрыты. Закрытый раздел — 56px, attention добавляет строку проблемных чипов. Новые радиусы/отступы — frontmatter itogi-*; disclosure-круг 28px, dot 8px, строка проблем 44px, bar-row 40px, track 6px.

Заголовок — native button с aria-expanded/aria-controls и зоной касания всей ширины ≥48px. Закрытый раздел раскрывает тап по любой части карточки; открытый сворачивает только heading; «Весь брак» сохраняет прежний лист и не сворачивает секцию. Enter/Space работают через кнопку. Тело закрытого раздела скрыто CSS и inert. Высота меняется мгновенно; только chevron поворачивается за 260ms по прежней кривой, reduced-motion убирает переход.

Один новый ключ `omoti_anikina_stats_sections_v1` сохраняет пять boolean при каждом toggle. Чтение недостающего/неboolean поля даёт default этого поля; malformed/недоступное чтение или ошибка записи возвращают defaults без сообщений. Смена периода, Касса⇄Итоги, reload и retry не сбрасывают сохранённые состояния. Прежняя R2 свёртка без storage теперь историческая.

Сводки читают только существующий DOM: s-sales/s-qty, первое dd бонусов, количество native staff/top строк; один должник — прежняя ss-amount, несколько — число сотрудников; брак — прежняя строка «Итого». Нет новой денежной агрегации. Native s-sub и loyalty-stat-title сохраняются скрытыми. Брак показывает первые три native строки; полный список копируется в прежний лист до скрытия preview. Staff bar — qty/max только визуальное отношение; Top width оставляет native .fs-bar. «Нет данных» и тексты/unknown/reconciliation модуля бонусов дословно из владельцев.

Период — две строки из activePeriodType/currentPeriodRange.label: диапазон без года, статус из скобок в отдельной pill; «Всё время» одна строка. Лист использует прежние btn-week/month/all, menu-week/month и .period-dropdown-item: 3 сегмента, строки ≥52px, выбор — янтарный круг с native SVG check справа. Week/month сегменты показывают соответствующее меню; пункт вызывает прежний selectWeek/selectMonth, «Всё время» сразу selectAll. loadStats/renderStatsSummary и дата/полнота остаются финансовыми владельцами. Ни «К выплате», ни тариф30/90 не добавляются.

Scoped integration aliases (.k-stats и #c31-period-sheet.k-itogi-period) снимают прежний flex/padding/border-bottom native строк: grid с gap10 для bars; content-box сохраняет высоту border-row. Колонки staff 92px/остаток/56px, top 18px/132px/остаток/30px. Bonus div — прозрачный без padding/рамок, align-items:stretch и justify-content:flex-start; dd сверху, note сохраняет native paragraph margin-bottom:1em. Пункт периода full width, flex и divider с check справа. Если перед Браком есть видимый долг, margin-top подзаголовка14px; пустой k-bars margin-top0. Эти aliases восстанавливают exact box model sealed CSS и не меняют значения. R2 добавляет только period-body gap и menu flex-column gap из `spacing.itogi-period-gap`; ss-amount min-width0 убирает native80px ограничение в grid.auto-column. Ни одно правило за пределами scoped Итогов/листа периода не меняется.

Загрузка — три scoped skeleton блока56px, без прежних hero186/attention250/next150. «Нет связи» сохраняет native retry, данные/секции после повтора; «Нет данных» — native empty row. Остальная загрузка/ошибки C3.2 других экранов прежние.

Служебные строки журнала имеют обычную белую поверхность. Выбранная карта имеет янтарную плашку, неподтверждённая — нейтральную недоступную поверхность. Камера — белый контейнер с тёмным окном по реализованной интеграции; готовый поток в QA синтетический. На других поверхностях Loading сохраняет прежние состояния; empty и network recovery имеют белый icon-chip, исходный текст и исходный retry-handler. Clear-search — светлая вторичная кнопка.

### Inputs / Fields

Прежние input/textarea с прежними ID переносятся целиком. Основное поле — светлое, фокус — белая поверхность и внутренний тёмный контур 2px; ошибка — красный контур. Поиск использует общий контур контейнера без второго контура input. Размеры, inputmode и guards сохраняются; оформление не корректирует введённую сумму автоматически.

Обычный раскрытый чек разделяет название/цену за единицу, исходные quantity-controls и сумму строки. Компактный акционный лист показывает количество отдельной inline-подписью и скрывает quantity-controls только в этом представлении. Подробный чек собирает состав в отдельный контейнер со строками минимум 32px и отдельным итогом; кнопка редактирования сохраняет высоту 52px без flex-сжатия. Открытие комментария переводит фокус и прокручивает textarea к нижнему видимому краю, сохраняя отдельный pinned total; headless focus/content не доказывает нативное перекрытие клавиатурой. Ввод УДАЛИТЬ сохраняет тёмный внутренний контур и маленький valid-check справа; checkbox имеет округлую опасную выбранную поверхность с vector-check. Deletion guard, checkbox и required reason определяются исходными handlers. Это описание текущего кода после корректировок, а не независимый visual PASS.

### Navigation

Одна нижняя навигация Касса / Журнал / Итоги. Используются прежние `.tab-btn` и `switchTab`, активность — `aria-current="page"`; переключатель «Служебное» отсутствует. При финансовой блокировке переход запрещён. Листы имеют `role="dialog"`, `aria-modal`, Escape, возврат фокуса и локальную Tab-петлю. Свайп заголовка вниз закрывает лист после смещения больше 60px.

Locked presentation приглушает grid, seller и nav до opacity .45, сохраняя читаемую recovery CTA без повторного приглушения. Док скрыт под открытой камерой, QR регистрации и deletion layer, а также при определённой кодом клавиатуре. Финансовые guards продолжают действовать независимо от визуальной opacity.

### Catalogue / Counter

Основная область товара вызывает прежний `changeQty(name,1)`. Отдельный счётчик открывает «− / +» без изменения количества. Тап вне открытого stepper только закрывает его и ничего не добавляет. Одновременно открыт один stepper; idle закрытие — 4с. Undo хранится в памяти текущей страницы, отменяет количество через прежний handler и не меняет оплату/карту/комментарий. UI storage-key подсказки каталога — `omoti_anikina_count_hint_v1` (Итоги отдельно добавляют только `omoti_anikina_stats_sections_v1`); показ hint через 260мс, до трёх раз, 4с, после открытия stepper больше не показывается. 260мс — текущая задержка подсказки, не правило количества.

### Integration / Financial Boundaries

| Связь | DOM / слой адаптера C3.2 | Владелец данных и действия | Эталоны |
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
| Итоги/период | itogi.js, .k-sec; прежние `s-*`, stats/period/defects containers | `renderStatsSummary`, `loadStats`, selectWeek/selectMonth/selectAll | ST-01…18, SW-01…10; IT-03/05/06 содержание |
| Доступ/уведомления | исходные auth/notice/push nodes, point menu | device access, notices, existing retry/push handlers | SY-01/02/04 |

`interface.js` сохраняет ссылки на прежние handlers и добавляет представление/локальные guards. Цены, скидки, восемь способов оплаты, смешанная проверка, snapshots наборов, записи и retry принадлежат HTML и финансовым модулям. Сумма чека и к оплате показываются отдельно. Поиск работает только среди уже загруженных чеков; сумма дня не рассчитывается. Unknown-покупка не запускает повтор checkout; модульный отказ/ожидание не снимается дизайнерским слоем.

R2 делает повторные UI-lock присваивания идемпотентными: disabled ставится только при реальном изменении. Это прекращает MutationObserver-loop, не меняя финансовый отказ. Отказ auth блокирует закрытие уже существующего basket и новые товарные controls; после снятия auth вызывается исходный updateCart для восстановления guards. Когда модуль уже разрешил закрытие, due известен, ожидания/lock нет и это не correction, presentation возвращает готовую подпись «Закрыть чек»/«Сохранить изменения». Unknown, лимиты, disabled и purchase identity не переопределяются ради подписи.

Единственная предусмотренная правка финансового модуля — Anikina-only async confirmation `C31Confirm(message)` вместо `window.confirm`: тот же текст и boolean, cancel без записи. Текущая synthetic regression дополнительно подтверждает принятие: вызван исходный checkout ровно один раз, после подтверждения UI освобождается; это не настоящая бонусная покупка. Соседние кассы сохраняют native-confirm. Первичные namespace продавцов, очереди, устройства, кэша и бонусных pending/correction не заменяются; PIN, токены и клиентские данные в этой документации отсутствуют. Manifest, Service Worker, vendor и QR SVG не становятся объектом дизайн-правки.

### Icons / Motion

Новые Итоги используют native inline SVG 16×16, viewBox24×24, currentColor stroke2.4, rounded caps/joins: chevron heading/period, check выбранного периода, chevron «Весь брак». Новые raster для shipping не созданы. Высотной disclosure-анимации нет; только chevron transform260ms и header shadow200ms, reduced-motion снимает оба.


`interface.js` содержит inline SVG undo/card/receipt/journal/stats/search/reload/close/check/upload/warning: viewBox 24×24, stroke currentColor, ширина штриха 2.2, обычный размер 18–20px; дополнительные статусы используют 16/24/32px по месту. Back подробного чека — SVG chevron 16px со штрихом 2.6. Готовность, очередь, offline/reconciliation и ошибка имеют разные vector-иконки тоста; универсальная галочка успеха больше не подменяет семантику всех сообщений.

Тост C3.2 находится на 8px + safe-area-top поверх верхней строки, выезжает сверху на 72px; lifetime 2000мс и текст принадлежат исходному showToast. Прежняя C3.1 схема top96/40 и сдвиг списка по высоте тоста не является текущим стандартом C3.2.

Подключены неизменённые approved [motion.css](motion.css) и [motion.js](motion.js), `KMotion.init(app)`. Общая кривая `cubic-bezier(.2,.8,.2,1)`; WAAPI ставит её на кадры, общая easing linear. Shake использует `ease` по кадрам как фактический approved motion.js.

| Эффект | Реализованные параметры и trigger |
|---|---|
| Press |110мс; плитка scale .965, кнопки .96; pointerup/cancel/leave снимают press. |
| Fly +1 |420мс, подъём 28px, ≤6 одновременно; только успешный +1 телом плитки. |
| Pop |260мс, .6 →1.18 на 55% →1 после фактического изменения количества. |
| Tick / bump |260/240мс; подсветка суммы rgba(255,162,26,.28) и count; кроме первого появления. |
| Dock reveal |height260мс/opacity200мс;0fr↔1fr по пустому/непустому чеку, пустые rows inert. |
| Sheet / scrim / toast / step |sheet260мс и 16px, opacity/scrim200мс; toast260/200мс и 72px; step200мс scale .96→1. |
| Confirmed save |flash360мс .2→2.2 ease-out; tilesOut240мс, шаг 25мс максимум 10; «Готово» во время уезда дока. Queue/error/unknown не запускают успех. |
| Missing seller shake |300мс, X 0/−5/+5/−5/+5/0; повтор во время эффекта игнорируется. |
| Haptic |navigator.vibrate(8) только фактический +1 кассира; без undo, при наличии API. iPhone Safari не подменяется. |

Повторы pop/bump/tick/flash перезапускают эффект; motion не ждётся обработчиками. Success привязан к результату исходного closeCheck: новым native success-тостом подтверждено сохранение, корзина пуста и нет pending модулей; очередь, отказ или неизвестность не получают успешную анимацию. Reduced-motion на лету снимает `k-fx`, отключает transitions/animations, fly и vibrate; состояния показываются сразу.

## Do's and Don'ts

### Do:

- Do брать визуальные значения и состояния из утверждённого C3.2 и сохранённых частей C3.1, а финансовые тексты и доступность — из кода владельца.
- Do сохранять прежние ID, namespace, API и identity операций при переносе в листы и док.
- Do показывать отдельно количество, цену, сумму чека и к оплате; неизвестные бонусы показывать «—».
- Do различать локальную реализацию, проверку с фикстурами, deploy и проверку опубликованной кассы.
- Do сравнивать оригинальные PNG при одинаковом viewport и сохранять реальные мобильные проверки как отдельный этап.

### Don't:

- Don't распространять C3.2 на Советскую, Новогоднюю или общую ERP без отдельной задачи.
- Don't подменять статусы/лимиты/цены фиктивными значениями ради совпадения с макетом.
- Don't повторять unknown-бонусную покупку или очищать pending/recovery state через дизайн-слой.
- Don't считать browser mocks доказательством реальных денег, нативной клавиатуры, камеры или safe-area.
- Don't считать этот DESIGN.md, исторический C3.1 R2 или числовой pixel diff приёмкой 49 C3.2 состояний и физической iPhone-прокрутки.

Historical C3.1 note (сохранена): R2 заменил основные close/check/reload/toast/search-clear/period/back glyph-иконки на inline SVG; остаточный текстовый знак warning-title не становится новым правилом компонентов. Утверждённые заголовки карточек и служебная лента сохраняют приоритет владельца. Public acceptance R2 указана отдельной локальной отметкой выше; она не означает проверки реальных денег, физической клавиатуры, камеры или safe-area. Расхождения не узакониваются записью в документации.
