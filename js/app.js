// HR Onboarding Dashboard — Alpine.js component

const TASK_TEMPLATE = [
  { day: -7, role: "hr",       title: "Приветственное сообщение + список 11 документов" },
  { day: -7, role: "hr",       title: "Email: ИТ + АХО + линейный руководитель" },
  { day: -7, role: "hr",       title: "Email: бухгалтерия + юристы (документы кандидата)" },
  { day: -7, role: "hr",       title: "Email: бухгалтерия (оффер)" },
  { day: -5, role: "legal",    title: "Проекты ТД и NDA, согласование" },
  { day: -5, role: "it",       title: "Подготовка техники, корп. почты, доступов" },
  { day: -3, role: "office",   title: "Рабочее место, канцелярия, заказ пропуска" },
  { day: -3, role: "lead",     title: "Индивидуальный план на испытательный срок" },
  { day: -2, role: "acct",     title: "Распечатка комплекта документов, стикеры" },
  { day: -1, role: "hr",       title: "Финальная проверка готовности" },
  { day: 0,  role: "hr",       title: "Встреча у входа, экскурсия, Welcome book" },
  { day: 0,  role: "hr",       title: "Фото сотрудника + добавление в WhatsApp" },
  { day: 0,  role: "hr",       title: "Email Елене Малышевой (данные для инструктажа ОТ)" },
  { day: 0,  role: "acct",     title: "Внесение в 1С:ЗУП, карточка Т2" },
  { day: 0,  role: "acct",     title: "Заявления: приём, перечисление ЗП, аванс" },
  { day: 0,  role: "acct",     title: "Ознакомление с регламентами под подпись" },
  { day: 0,  role: "acct",     title: "Подпись ТД у генерального директора" },
  { day: 0,  role: "office",   title: "Именной пропуск, приветственная рассылка" },
  { day: 0,  role: "lead",     title: "Установочная встреча, план работ" },
  { day: 0,  role: "safety",   title: "Инструктаж ОТ, пожарный, электробезопасность" },
  { day: 0,  role: "hr",       title: "Обратная связь в конце дня" },
  { day: 1,  role: "employee", title: "Знакомство с командой, обход офиса" },
  { day: 3,  role: "hr",       title: "Check-in: «как первые впечатления»" },
  { day: 7,  role: "lead",     title: "Промежуточная встреча по задачам" },
  { day: 14, role: "hr",       title: "Пульс-опрос 2 недели" },
  { day: 30, role: "hr",       title: "1:1 первого месяца" },
  { day: 30, role: "employee", title: "Опрос адаптации" },
  { day: 60, role: "hr",       title: "60-дневный 1:1" },
  { day: 90, role: "hr",       title: "Финальный review" },
  { day: 90, role: "lead",     title: "Решение по итогам испытательного" },
];

const STATUS_LABELS = {
  prep: "Подготовка",
  day1: "Первый день",
  probation: "Испытательный",
  staffed: "В штате",
  left: "Ушёл",
};

const ROLE_LABELS = {
  hr: "HR",
  acct: "Бухгалтер",
  office: "Офис",
  lead: "Линейный",
  it: "ИТ",
  legal: "Юристы",
  safety: "Охрана труда",
  employee: "Сотрудник",
};

const EVENT_ICONS = {
  employee_created: "👤",
  welcome_video: "🎥",
  welcomebook_sent: "📖",
  task_sent: "📩",
  task_done: "✅",
  task_overdue: "⚠️",
  question_raised: "❓",
  pulse_survey: "📊",
  document_received: "📎",
  instruction_passed: "🦺",
  probation_pass: "🎉",
  scheduler_run: "⏰",
};

document.addEventListener('alpine:init', () => {
  Alpine.data('dashboard', () => ({
    employees: [],
    events: [],
    detailOpen: false,
    newOpen: false,
    current: null,
    search: '',
    filter: 'all',
    now: '',
    _pollTimer: null,

    async init() {
      this.tickClock();
      setInterval(() => this.tickClock(), 1000);

      // 1. Load seed mocks (always, for density)
      try {
        const [emps, evs] = await Promise.all([
          fetch('mock/employees.json').then(r => r.json()),
          fetch('mock/events.json').then(r => r.json()),
        ]);
        this.employees = emps;
        this.events = evs.sort((a, b) => new Date(b.ts) - new Date(a.ts));
      } catch (e) {
        console.error('Failed to load mock data', e);
      }

      // 2. Merge real employees + events from live bot (if HR_API_BASE configured)
      await this.mergeLive();

      // 3. Poll events every 7s
      this._pollTimer = setInterval(() => this.pollEvents(), 7000);
    },

    tickClock() {
      const d = new Date();
      this.now = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    },

    async mergeLive() {
      const base = window.HR_API_BASE;
      if (!base) return;

      // Employees — real ones сверху (negative id чтобы не коллизить с mock)
      try {
        const realEmps = await fetch(`${base}/api/employees`).then(r => r.json());
        if (Array.isArray(realEmps)) {
          const adapted = realEmps.map(e => ({
            id: -e.id,  // negative to avoid collision with mocks
            _real: true,
            fio: e.fio,
            avatar: '🎬',  // mark real ones
            position: e.position,
            company: e.company,
            manager: 'live',
            start_date: e.start_date,
            status: e.status,
            progress: e.progress,
            overdue: e.overdue,
            hr_flag: e.overdue > 0 ? `${e.overdue} задач просрочено` : (e.status === 'day1' ? 'сегодня Day 1' : null),
            tg_username: e.tg_username,
          }));
          // prepend real ones
          this.employees = [...adapted, ...this.employees];
        }
      } catch (e) {
        console.warn('mergeLive employees failed', e);
      }

      // Initial events — последние из live + mocks
      try {
        const realEvs = await fetch(`${base}/api/events`).then(r => r.json());
        if (Array.isArray(realEvs)) {
          const adapted = realEvs.map(e => ({
            id: 1000000 + e.id,  // shift namespace
            ts: e.ts,
            type: e.type,
            employee_id: e.employee_id || 0,
            employee: e.employee,
            text: e.text,
            _real: true,
          }));
          this.events = [...adapted, ...this.events].sort((a, b) => new Date(b.ts) - new Date(a.ts));
        }
      } catch (e) {
        console.warn('mergeLive events failed', e);
      }
    },

    async pollEvents() {
      const base = window.HR_API_BASE;
      if (!base) return;
      // most recent real event ts
      const recent = this.events.find(e => e._real);
      const since = recent ? (new Date(recent.ts).getTime() / 1000) : 0;
      try {
        const fresh = await fetch(`${base}/api/events?since=${since}`).then(r => r.json());
        if (!Array.isArray(fresh) || fresh.length === 0) return;
        const adapted = fresh.map(e => ({
          id: 1000000 + e.id,
          ts: e.ts,
          type: e.type,
          employee_id: e.employee_id || 0,
          employee: e.employee,
          text: e.text,
          _real: true,
        }));
        // dedupe by id
        const existing = new Set(this.events.map(x => x.id));
        const newOnes = adapted.filter(e => !existing.has(e.id));
        if (newOnes.length) {
          this.events = [...newOnes, ...this.events].slice(0, 80).sort((a, b) => new Date(b.ts) - new Date(a.ts));
          // Also re-fetch employees if new employee_created event
          if (newOnes.some(e => e.type === 'employee_created' || e.type === 'status_changed')) {
            await this.refetchLiveEmployees();
          }
        }
      } catch (e) {
        console.warn('poll failed', e);
      }
    },

    async refetchLiveEmployees() {
      const base = window.HR_API_BASE;
      if (!base) return;
      try {
        const real = await fetch(`${base}/api/employees`).then(r => r.json());
        if (!Array.isArray(real)) return;
        const adapted = real.map(e => ({
          id: -e.id,
          _real: true,
          fio: e.fio,
          avatar: '🎬',
          position: e.position,
          company: e.company,
          manager: 'live',
          start_date: e.start_date,
          status: e.status,
          progress: e.progress,
          overdue: e.overdue,
          hr_flag: e.overdue > 0 ? `${e.overdue} задач просрочено` : (e.status === 'day1' ? 'сегодня Day 1' : null),
          tg_username: e.tg_username,
        }));
        // keep mocks, replace real ones
        const mocks = this.employees.filter(e => !e._real);
        this.employees = [...adapted, ...mocks];
      } catch (e) {
        console.warn('refetchLive failed', e);
      }
    },

    async refreshFeed() {
      // Fake "new event" injection to show animation
      const pool = [
        { type: 'task_done', employee: 'Иванов П.С.',    text: 'подписал согласие на обработку персональных данных' },
        { type: 'welcome_video', employee: 'Волков А.Н.', text: 'получил welcome-видео от основателя' },
        { type: 'question_raised', employee: 'Виноградов М.А.', text: 'задал вопрос: «где забрать рабочий ноутбук?»' },
        { type: 'task_done', employee: 'Смирнова А.П.',  text: 'подписала трудовой договор' },
        { type: 'document_received', employee: 'Морозов В.А.', text: 'прислал документы воинского учёта' },
      ];
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const now = new Date();
      const newEv = {
        id: Date.now(),
        ts: now.toISOString(),
        type: pick.type,
        employee: pick.employee,
        employee_id: 0,
        text: pick.text,
      };
      this.events = [newEv, ...this.events].slice(0, 60);
    },

    get metrics() {
      const inOnb = this.employees.filter(e => ['prep', 'day1', 'probation'].includes(e.status)).length;
      const overdue = this.employees.reduce((s, e) => s + (e.overdue || 0), 0);
      const today = new Date().toISOString().slice(0, 10);
      const todayStart = this.employees.filter(e => e.start_date === today).length;
      const now = new Date();
      const weekEnd = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
      const upcomingReview = this.employees.filter(e => {
        if (e.status !== 'probation') return false;
        const start = new Date(e.start_date);
        const day90 = new Date(start.getTime() + 90 * 24 * 3600 * 1000);
        return day90 >= now && day90 <= weekEnd;
      }).length;
      return { inOnboarding: inOnb, overdue, todayStart, upcomingReview };
    },

    get filteredEmployees() {
      const q = this.search.trim().toLowerCase();
      return this.employees.filter(e => {
        if (this.filter !== 'all' && e.status !== this.filter) return false;
        if (q && !(e.fio.toLowerCase().includes(q) || e.position.toLowerCase().includes(q))) return false;
        return true;
      });
    },

    get companyStats() {
      const byCo = {};
      this.employees.forEach(e => { byCo[e.company] = (byCo[e.company] || 0) + 1; });
      return Object.entries(byCo).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    },

    get statusStats() {
      const colors = {
        prep: 'var(--ochre)',
        day1: 'var(--bordeaux)',
        probation: 'var(--moss)',
        staffed: 'var(--ink)',
      };
      const byStatus = {};
      this.employees.forEach(e => { byStatus[e.status] = (byStatus[e.status] || 0) + 1; });
      return ['prep', 'day1', 'probation', 'staffed']
        .filter(k => byStatus[k])
        .map(key => ({ key, label: STATUS_LABELS[key], count: byStatus[key], color: colors[key] }));
    },

    get upcoming() {
      // Next 4 upcoming start-dates / 90-day reviews
      const now = new Date();
      const items = [];
      this.employees.forEach(e => {
        const sd = new Date(e.start_date);
        if (e.status === 'prep' && sd >= now) {
          items.push({ id: `s${e.id}`, when: this.shortDate(sd), text: `${e.fio.split(' ').slice(0, 2).join(' ')} — первый день`, ts: sd });
        }
        if (e.status === 'probation') {
          const d90 = new Date(sd.getTime() + 90 * 24 * 3600 * 1000);
          if (d90 >= now && d90 <= new Date(now.getTime() + 14 * 24 * 3600 * 1000)) {
            items.push({ id: `r${e.id}`, when: this.shortDate(d90), text: `${e.fio.split(' ').slice(0, 2).join(' ')} — 90-day review`, ts: d90 });
          }
        }
      });
      return items.sort((a, b) => a.ts - b.ts).slice(0, 5);
    },

    get timelineForCurrent() {
      if (!this.current) return [];
      const emp = this.current;
      const done = emp.progress.done;
      const total = TASK_TEMPLATE.length;
      const overdueCount = emp.overdue || 0;

      // Build tasks with status
      const tasks = TASK_TEMPLATE.map((t, idx) => {
        let status = 'todo';
        if (idx < done) status = 'done';
        // Mark first `overdueCount` pending tasks as overdue (those right after "done" boundary)
        return { ...t, idx, status };
      });
      if (overdueCount > 0) {
        let marked = 0;
        for (let i = done; i < tasks.length && marked < overdueCount; i++) {
          tasks[i].status = 'overdue';
          marked++;
        }
      }

      // Group by day
      const groups = {};
      tasks.forEach(t => {
        if (!groups[t.day]) groups[t.day] = [];
        groups[t.day].push(t);
      });
      return Object.keys(groups)
        .map(d => parseInt(d, 10))
        .sort((a, b) => a - b)
        .map(day => ({ day, tasks: groups[day] }));
    },

    openDetail(emp) {
      this.current = emp;
      this.detailOpen = true;
      document.body.style.overflow = 'hidden';
    },
    closeDetail() {
      this.detailOpen = false;
      this.current = null;
      document.body.style.overflow = '';
    },
    openNewModal() {
      this.newOpen = true;
    },

    formatDate(iso) {
      const d = new Date(iso);
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    shortDate(d) {
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    },
    formatEventTs(iso) {
      const d = new Date(iso);
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      if (isToday) {
        return 'сегодня · ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      }
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return 'вчера · ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) + ' · ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    },

    statusLabel(s) { return STATUS_LABELS[s] || s; },
    roleLabel(r) { return ROLE_LABELS[r] || r; },
    dayLabel(d) {
      if (d < 0) return `День -${Math.abs(d)} (подготовка)`;
      if (d === 0) return 'Day 0 · первый день';
      return `Day ${d}`;
    },
    taskStatusLabel(s) {
      if (s === 'done') return 'готово';
      if (s === 'overdue') return 'просрочка';
      return 'в работе';
    },
    eventIcon(type) { return EVENT_ICONS[type] || '•'; },
  }));
});
