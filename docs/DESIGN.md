# Design System

Дизайн-система дашборда. Без тёмной/чёрно-синей схемы (запрет из CLAUDE.md). Основа — vosmerki-стиль (cream + bordeaux + ochre).

## Цветовая палитра (OKLCH)

```css
:root {
  /* Base */
  --bg:         oklch(96% 0.02 85);    /* cream background */
  --surface:    oklch(98% 0.015 85);   /* card surface */
  --ink:        oklch(18% 0.03 25);    /* primary text (dark bordeaux) */
  --ink-muted:  oklch(40% 0.04 25);    /* secondary text */

  /* Accents */
  --bordeaux:   oklch(42% 0.17 20);    /* primary action */
  --ochre:      oklch(70% 0.14 70);    /* highlight / pills */
  --moss:       oklch(55% 0.12 140);   /* success */
  --rust:       oklch(55% 0.18 40);    /* overdue / danger */

  /* Role colors (для timeline задач в detail view) */
  --role-hr:       oklch(55% 0.15 300);  /* purple */
  --role-acct:     oklch(55% 0.15 150);  /* green */
  --role-office:   oklch(70% 0.12 30);   /* pink */
  --role-lead:     oklch(65% 0.15 50);   /* orange */
  --role-it:       oklch(55% 0.14 230);  /* blue */
  --role-legal:    oklch(55% 0.02 250);  /* gray */
  --role-safety:   oklch(75% 0.14 90);   /* yellow */
}
```

## Типографика

```css
--font-serif:  "DM Serif Display", Georgia, serif;  /* H1, крупные цифры */
--font-sans:   "Space Grotesk", "Inter", system-ui, sans-serif;  /* body */
--font-mono:   "JetBrains Mono", ui-monospace, monospace;  /* даты, id */
```

**Fluid typography:**
```css
--h1: clamp(2rem, 4vw + 1rem, 3.5rem);
--h2: clamp(1.5rem, 2vw + 1rem, 2.25rem);
--body: clamp(0.95rem, 0.5vw + 0.85rem, 1.05rem);
```

## Spacing (8px baseline)

```css
--space-1: 0.5rem;  /*  8px */
--space-2: 1rem;    /* 16px */
--space-3: 1.5rem;  /* 24px */
--space-4: 2rem;    /* 32px */
--space-6: 3rem;    /* 48px */
--space-8: 4rem;    /* 64px */
```

## Radius

```css
--radius-sm: 0.375rem;
--radius-md: 0.75rem;
--radius-lg: 1.25rem;
--radius-pill: 999px;
```

## Shadows (soft, paper-like)

```css
--shadow-sm: 0 1px 2px oklch(20% 0.04 25 / 0.08);
--shadow-md: 0 4px 16px oklch(20% 0.04 25 / 0.12);
--shadow-lg: 0 12px 48px oklch(20% 0.04 25 / 0.16);
```

## Grain overlay

Лёгкое зерно на фоне (vosmerki-сигнатура) через псевдо-элемент с SVG noise, opacity 0.04.

## Status pills

- **prep** → ochre fill, bordeaux text
- **day1** → bordeaux fill, cream text
- **probation** → moss fill, cream text
- **staffed** → ink fill, cream text
- **overdue** → rust fill + blinking dot, cream text

## Компоненты

### `.metric-card`
Большое число сверху, подпись снизу, иконка/иллюстрация справа (абсолют). Hover: микро-scale + лёгкая тень.

### `.employee-row`
Avatar (emoji или иллюстрация) + ФИО + должность + юр.лицо chip + дата выхода + progress bar + status pill + ... menu. Clickable, открывает модалку detail.

### `.timeline` (в detail modal)
Вертикальная линия с точками по дням (-7, -1, 0, 1, 7, 30, 90). Задачи группируются под днями, отсортированы по роли, цветной chip слева.

### `.activity-feed`
Список событий, каждое: иконка-роль + текст + timestamp. Новые события появляются с микро-анимацией slide-in.

## Адаптив

- Desktop (`>= 1200px`): 3 колонки — hero/metrics сверху, table + activity feed рядом
- Tablet (`768px-1199px`): 2 колонки — table, activity feed снизу
- Mobile (`< 768px`): одна колонка, стэк секций, activity feed как drawer снизу

## Иллюстрации

4 штуки, сгенерированы через `/image-gen` (OpenRouter Gemini 2.5 Flash), сохраняются как `.webp`:

1. `hero.webp` — стилизованный монтажник у подстанции + иконки задач (для hero секции)
2. `empty.webp` — уютное рабочее место, «пока нет новых сотрудников»
3. `success.webp` — галочка + конфетти в vosmerki-палитре
4. `detail-bg.webp` — абстрактные формы, фон для detail модалки

**Prompt template:**
> Flat illustration in OKLCH palette (cream background, bordeaux accents, ochre highlights), geometric shapes, industrial energy sector aesthetic, no text, {specific scene}, minimal details, friendly warm mood.

## Референсы

- `~/sila-toka-offer/` — цвета и типографика уже обкатаны на клиенте
- [vosmerki.ru](https://vosmerki.ru) — источник эстетики
- OKLCH color picker: https://oklch.com
