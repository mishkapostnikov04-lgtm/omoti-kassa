# OMOTI · GitHub Pages кассы

Следуй [единому регламенту](../OMOTI_WORK_REGULATION.md) и [инструкциям проекта](../AGENTS.md), [реестру дизайна](../design-system/README.md). Для Аникиной утверждён отдельный [C3.1](../design-system/modules/cashier-anikina/README.md).

Не распространяй её стили на две другие кассы. Сохраняй API, финансовые handlers и ключи localStorage. Для browser QA полностью mock `orders.omoti.ru`, блокируй Service Worker; никаких реальных чеков/устройств/бонусных операций. Не печатай configured PIN, токены и клиентские данные.
