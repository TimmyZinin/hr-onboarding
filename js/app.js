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
  hr: "HR", acct: "Бух", office: "Офис", lead: "Линейный",
  it: "ИТ", legal: "Юристы", safety: "ОТ", employee: "Сотрудник",
};

const EVENT_ICON = {
  employee_created:  { id: "i-user-plus", cls: "ei-create" },
  welcome_video:     { id: "i-video",     cls: "ei-video" },
  task_done:         { id: "i-check",     cls: "ei-done" },
  task_sent:         { id: "i-send",      cls: "ei-sent" },
  task_overdue:      { id: "i-alert",     cls: "ei-overdue" },
  task_postponed:    { id: "i-clock",     cls: "ei-sched" },
  question_raised:   { id: "i-question",  cls: "ei-question" },
  scheduler_run:     { id: "i-refresh",   cls: "ei-sched" },
  status_changed:    { id: "i-refresh",   cls: "ei-status" },
  document_received: { id: "i-inbox",     cls: "ei-sent" },
  welcomebook_sent:  { id: "i-inbox",     cls: "ei-sent" },
  pulse_survey:      { id: "i-chart",     cls: "ei-done" },
  probation_pass:    { id: "i-check",     cls: "ei-done" },
};

const NEW_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

document.addEventListener('alpine:init', () => {
  Alpine.data('dashboard', () => ({
    employees: [],
    events: [],
    toasts: [],
    detailOpen: false,
    newOpen: false,
    current: null,
    search: '',
    filter: 'all',
    now: '',
    today: '',
    greetingName: 'Дмитрий',
    _pollTimer: null,
    _seenEmployeeIds: new Set(),

    async init() {
      this.tickClock();
      setInterval(() => this.tickClock(), 1000);

      // Load mocks (density)
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

      // Live merge
      await this.mergeLive();

      // Mark all currently-known live employees as "seen" (not NEW)
      this.employees.filter(e => e._real).forEach(e => this._seenEmployeeIds.add(e.id));

      // Poll
      this._pollTimer = setInterval(() => this.pollEvents(), 7000);
    },

    tickClock() {
      const d = new Date();
      this.now = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.today = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    },

    _adaptLiveEmp(e) {
      return {
        id: -e.id,
        _real: true,
        fio: e.fio,
        position: e.position,
        company: e.company,
        manager: null,
        start_date: e.start_date,
        status: e.status,
        progress: e.progress,
        overdue: e.overdue,
        hr_flag: e.overdue > 0 ? `${e.overdue} ${this.pluralize(e.overdue, 'задача', 'задачи', 'задач')} просрочено` : (e.status === 'day1' ? 'сегодня Day 1' : null),
        tg_username: e.tg_username,
      };
    },

    _adaptLiveEv(e) {
      return {
        id: 1_000_000 + e.id,
        ts: e.ts,
        type: e.type,
        employee_id: e.employee_id || 0,
        employee: e.employee,
        text: e.text,
        _real: true,
      };
    },

    async mergeLive() {
      await this.refetchLiveEmployees();
      const base = window.HR_API_BASE;
      if (!base) return;
      try {
        const realEvs = await fetch(`${base}/api/events`).then(r => r.json());
        if (Array.isArray(realEvs)) {
          const adapted = realEvs.map(x => this._adaptLiveEv(x));
          const seen = new Set(this.events.map(x => x.id));
          const uniq = adapted.filter(x => !seen.has(x.id));
          this.events = [...uniq, ...this.events].sort((a, b) => new Date(b.ts) - new Date(a.ts));
        }
      } catch (e) { console.warn('mergeLive events failed', e); }
    },

    async refetchLiveEmployees() {
      const base = window.HR_API_BASE;
      if (!base) return;
      try {
        const real = await fetch(`${base}/api/employees`).then(r => r.json());
        if (!Array.isArray(real)) return;
        const now = Date.now();
        const adapted = real.map(e => {
          const adapted = this._adaptLiveEmp(e);
          // Mark as NEW if recent (not yet seen in this session, and created recently)
          if (!this._seenEmployeeIds.has(adapted.id)) {
            adapted._is_new = true;
          }
          return adapted;
        });
        const mocks = this.employees.filter(e => !e._real);
        this.employees = [...adapted, ...mocks];

        // After a while, drop _is_new flag
        setTimeout(() => {
          this.employees.forEach(e => { if (e._is_new) { e._is_new = false; this._seenEmployeeIds.add(e.id); } });
        }, NEW_WINDOW_MS);
      } catch (e) { console.warn('refetchLive failed', e); }
    },

    async pollEvents() {
      const base = window.HR_API_BASE;
      if (!base) return;
      const recent = this.events.find(e => e._real);
      const since = recent ? (new Date(recent.ts).getTime() / 1000) : 0;
      try {
        const fresh = await fetch(`${base}/api/events?since=${since}`).then(r => r.json());
        if (!Array.isArray(fresh) || fresh.length === 0) return;
        const adapted = fresh.map(x => ({ ...this._adaptLiveEv(x), _is_new: true }));
        const existing = new Set(this.events.map(x => x.id));
        const newOnes = adapted.filter(e => !existing.has(e.id));
        if (newOnes.length) {
          this.events = [...newOnes, ...this.events].slice(0, 80).sort((a, b) => new Date(b.ts) - new Date(a.ts));
          // Toast на employee_created
          newOnes.filter(e => e.type === 'employee_created').forEach(e => {
            this.pushToast(`🆕 ${e.employee} начал онбординг`, e.text);
          });
          // Если появился новый employee — перефетчим таблицу
          if (newOnes.some(e => e.type === 'employee_created' || e.type === 'status_changed')) {
            await this.refetchLiveEmployees();
          }
          // Drop _is_new flag после window
          setTimeout(() => {
            this.events.forEach(e => { if (e._is_new && newOnes.find(n => n.id === e.id)) e._is_new = false; });
          }, NEW_WINDOW_MS);
        }
      } catch (e) { console.warn('poll failed', e); }
    },

    async refreshFeed() {
      await this.pollEvents();
      this.pushToast('Обновлено', 'Данные свежие');
    },

    pushToast(title, desc) {
      const id = Date.now() + Math.random();
      this.toasts.push({ id, title, desc, leave: false });
      setTimeout(() => {
        const t = this.toasts.find(x => x.id === id);
        if (t) t.leave = true;
        setTimeout(() => { this.toasts = this.toasts.filter(x => x.id !== id); }, 300);
      }, 6000);
    },

    // === Getters ===
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
      const live = this.employees.filter(e => e._real).length;
      return { inOnboarding: inOnb, overdue, todayStart, upcomingReview, live };
    },

    get filteredEmployees() {
      const q = this.search.trim().toLowerCase();
      return this.employees.filter(e => {
        if (this.filter !== 'all' && e.status !== this.filter) return false;
        if (q && !(e.fio.toLowerCase().includes(q) || e.position.toLowerCase().includes(q))) return false;
        return true;
      });
    },

    get upcomingThisWeek() {
      const now = new Date();
      const weekEnd = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
      return this.employees.filter(e => {
        const sd = new Date(e.start_date);
        return e.status === 'prep' && sd > now && sd <= weekEnd;
      }).length;
    },

    get companyStats() {
      const byCo = {};
      this.employees.forEach(e => { byCo[e.company] = (byCo[e.company] || 0) + 1; });
      return Object.entries(byCo).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    },

    get statusStats() {
      const colors = {
        prep: 'var(--ochre)', day1: 'var(--bordeaux)',
        probation: 'var(--moss)', staffed: 'var(--ink)',
      };
      const byStatus = {};
      this.employees.forEach(e => { byStatus[e.status] = (byStatus[e.status] || 0) + 1; });
      return ['prep', 'day1', 'probation', 'staffed']
        .filter(k => byStatus[k])
        .map(key => ({ key, label: STATUS_LABELS[key], count: byStatus[key], color: colors[key] }));
    },

    get upcoming() {
      const now = new Date();
      const items = [];
      this.employees.forEach(e => {
        const sd = new Date(e.start_date);
        if (e.status === 'prep' && sd >= now) {
          items.push({ id: `s${e.id}`, when: this.shortDate(sd), text: `${this.shortName(e.fio)} — первый день`, ts: sd });
        }
        if (e.status === 'probation') {
          const d90 = new Date(sd.getTime() + 90 * 24 * 3600 * 1000);
          if (d90 >= now && d90 <= new Date(now.getTime() + 14 * 24 * 3600 * 1000)) {
            items.push({ id: `r${e.id}`, when: this.shortDate(d90), text: `${this.shortName(e.fio)} — 90-day review`, ts: d90 });
          }
        }
      });
      return items.sort((a, b) => a.ts - b.ts).slice(0, 6);
    },

    get timelineForCurrent() {
      if (!this.current) return [];
      const emp = this.current;
      const done = emp.progress.done;
      const overdueCount = emp.overdue || 0;
      const tasks = TASK_TEMPLATE.map((t, idx) => ({ ...t, idx, status: idx < done ? 'done' : 'todo' }));
      if (overdueCount > 0) {
        let marked = 0;
        for (let i = done; i < tasks.length && marked < overdueCount; i++) {
          tasks[i].status = 'overdue';
          marked++;
        }
      }
      const groups = {};
      tasks.forEach(t => { (groups[t.day] ??= []).push(t); });
      return Object.keys(groups).map(d => parseInt(d, 10)).sort((a, b) => a - b).map(day => ({ day, tasks: groups[day] }));
    },

    // === Actions ===
    openDetail(emp) { this.current = emp; this.detailOpen = true; document.body.style.overflow = 'hidden'; },
    closeDetail() { this.detailOpen = false; this.current = null; document.body.style.overflow = ''; },

    // === Helpers ===
    shortName(fio) {
      const p = fio.split(' ');
      if (p.length >= 2) return `${p[0]} ${p[1][0]}.`;
      return fio;
    },
    initials(fio) {
      const p = fio.trim().split(/\s+/);
      if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
      return (p[0] || '?').slice(0, 2).toUpperCase();
    },
    avatarColor(seed) {
      // simple hash → hue
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
      return `oklch(60% 0.13 ${h})`;
    },
    formatDate(iso) {
      const d = new Date(iso);
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    },
    shortDate(d) {
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    },
    formatEventTs(iso) {
      const d = new Date(iso);
      const today = new Date();
      const mins = Math.floor((today - d) / 60000);
      if (mins < 1) return 'только что';
      if (mins < 60) return `${mins} мин назад`;
      const hrs = Math.floor(mins / 60);
      if (today.toDateString() === d.toDateString()) {
        return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      }
      const y = new Date(today); y.setDate(today.getDate() - 1);
      if (y.toDateString() === d.toDateString()) return 'вчера · ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    },
    statusLabel(s) { return STATUS_LABELS[s] || s; },
    roleLabel(r) { return ROLE_LABELS[r] || r; },
    dayLabel(d) {
      if (d < 0) return `Подготовка · за ${Math.abs(d)} ${this.pluralize(Math.abs(d), 'день', 'дня', 'дней')} до выхода`;
      if (d === 0) return 'Day 0 · первый день';
      return `Day ${d}`;
    },
    taskStatusLabel(s) {
      if (s === 'done') return 'готово';
      if (s === 'overdue') return 'просрочка';
      return 'в работе';
    },
    eventIconId(type) { return (EVENT_ICON[type] || { id: 'i-inbox' }).id; },
    eventIconClass(type) { return (EVENT_ICON[type] || { cls: 'ei-sent' }).cls; },
    pluralize(n, one, few, many) {
      n = Math.abs(n) % 100;
      const n1 = n % 10;
      if (n > 10 && n < 20) return many;
      if (n1 > 1 && n1 < 5) return few;
      if (n1 === 1) return one;
      return many;
    },
  }));
});
