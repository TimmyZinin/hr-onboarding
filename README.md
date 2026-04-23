# HR Onboarding Dashboard

Веб-дашборд для HR-менеджера: все онбординги в одном окне. Список сотрудников, прогресс, live activity feed, метрики.

**Live:** https://timzinin.com/hr-onboarding/

## Что это

Инструмент для HR-менеджера, который ведёт онбординг нового сотрудника от оффера до 90-дневного review. Показывает:

- Сколько сотрудников сейчас в онбординге
- Где каждый находится (подготовка / Day 1 / испытательный / в штате)
- Какие задачи просрочены
- Кто выходит сегодня / на этой неделе
- Live-лента событий из связанного Telegram-бота

## Архитектура (коротко)

```
┌────────────────────────┐       ┌──────────────────────┐
│  Dashboard (this repo) │◄─────▶│  Bot + API (private) │
│  Static SPA на         │ HTTPS │  TimmyZinin/         │
│  GitHub Pages          │ JSON  │  hr-onboarding-bot   │
│  timzinin.com/hr-      │       │                      │
│  onboarding/           │       │                      │
└────────────────────────┘       └──────────────────────┘
         ▲                                    │
         │ opens                              │ sends tasks
         │                                    ▼
   HR-менеджер                       Новый сотрудник в TG
```

Dashboard poll'ит `/api/events` бот-сервиса раз в ~7 сек — показывает live-события (создание новичка, выполнение задачи, просрочка).

## Стек

- HTML + CSS (OKLCH, fluid typography)
- Vanilla JS + Alpine.js (lightweight reactivity)
- Mock data: `mock/employees.json`, `mock/events.json`
- Иллюстрации: OpenRouter Gemini 2.5 Flash (vosmerki-стиль)
- Deploy: GitHub Pages (auto)

## Структура

```
/
├── index.html              — entry
├── css/style.css           — OKLCH vosmerki tokens + layout
├── js/app.js               — Alpine components
├── mock/
│   ├── employees.json      — 15-20 seed сотрудников
│   └── events.json         — 30 начальных событий
├── assets/
│   └── *.webp              — иллюстрации
└── docs/
    ├── PROCESSES.md        — источник задач (из клиентских PDF)
    ├── DESIGN.md           — дизайн-система
    └── ROADMAP.md          — план по спринтам
```

## Quickstart

```bash
git clone https://github.com/TimmyZinin/hr-onboarding.git
cd hr-onboarding
npx serve .
# откроется на http://localhost:3000
```

## Лицензия

Приватное демо. Не для распространения.
