// Sample figures until the scoreboard is connected to the real registration sheets.
const SAMPLE = {
  me: {
    today: 2,
    usualDay: 2.8,
    usualByNow: 0.9,
    bestDay: 7,
    week: [3, 2, 4, 2, null],
    todayIndex: 3,
    month: 34
  },
  team: { today: 27, usualByNow: 36, registering: 17, people: 30 },
  colleges: [
    { name: 'Skills Academy', today: 12, usualByNow: 17 },
    { name: 'Matric College', today: 7, usualByNow: 9 },
    { name: 'Bellview', today: 8, usualByNow: 10 }
  ],
  wins: [
    { name: 'Sipho Dlamini', detail: 'Silver · 3 registrations today', time: '10:15' },
    { name: 'Ayesha Patel', detail: 'Best month so far · 58 registrations', time: '09:40' },
    { name: 'Nomsa Khumalo', detail: 'Bronze · first registration today', time: '09:05' },
    { name: 'Johan van Wyk', detail: 'Reached R5 000 cash this month', time: '08:30' }
  ]
};

const MILESTONES = [
  { count: 1, name: 'Bronze', medal: 'bronze' },
  { count: 3, name: 'Silver', medal: 'silver' },
  { count: 5, name: 'Gold', medal: 'gold' },
  { count: 10, name: 'Diamond', medal: 'diamond' }
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function create(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const formatNumber = (value) => value.toLocaleString('en-ZA', { maximumFractionDigits: 1 });
const initials = (name) => name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const percent = (value, of) => `${Math.round((value / of) * 100)}%`;

function showUser(user) {
  document.getElementById('user-initials').textContent = initials(user.name);
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-role').textContent = `${user.role} · ${user.college}`;

  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greeting').textContent = `${part}, ${user.name.split(' ')[0]}`;
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-ZA', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
}

function drawRing(container, value, target) {
  const ns = 'http://www.w3.org/2000/svg';
  const radius = 56;
  const length = 2 * Math.PI * radius;
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 132 132');

  [['ring-track', length], ['ring-fill', length * Math.min(1, value / target)]].forEach(([className, filled]) => {
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('class', className);
    circle.setAttribute('cx', '66');
    circle.setAttribute('cy', '66');
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke-width', '12');
    circle.setAttribute('stroke-linecap', 'round');
    circle.setAttribute('stroke-dasharray', `${filled} ${length}`);
    svg.append(circle);
  });

  const label = create('div', 'ring-label');
  label.append(create('b', '', String(value)), create('span', '', `of ${Math.ceil(target)} usual`));
  container.append(svg, label);
  container.setAttribute('aria-label', `${value} registrations today, compared with a usual day of ${formatNumber(target)}`);
}

function showMyDay(me) {
  const ahead = me.today >= me.usualByNow;
  const status = document.getElementById('pace-status');
  status.textContent = ahead ? 'Ahead of usual pace' : 'Behind usual pace';
  status.classList.add(ahead ? 'status-good' : 'status-waiting');

  drawRing(document.getElementById('today-ring'), me.today, me.usualDay);

  const toAverage = Math.ceil(me.usualDay - me.today);
  document.getElementById('today-lead').textContent = `${me.today} registration${me.today === 1 ? '' : 's'} so far today.`;
  document.getElementById('today-detail').textContent = toAverage > 0
    ? `You usually have about ${formatNumber(me.usualByNow)} by this time. ${toAverage} more reaches your daily average.`
    : 'You\'ve already passed your daily average.';

  const weekTotal = me.week.reduce((sum, day) => sum + (day || 0), 0);
  document.getElementById('fact-usual').textContent = formatNumber(me.usualDay);
  document.getElementById('fact-best').textContent = String(me.bestDay);
  document.getElementById('fact-week').textContent = String(weekTotal);
  document.getElementById('fact-month').textContent = String(me.month);
}

function showMilestones(me) {
  const list = document.getElementById('milestones');
  const goals = MILESTONES.map((goal) => ({ ...goal, label: String(goal.count) }));
  goals.push({ count: me.bestDay + 1, name: `New best day (${me.bestDay + 1})`, medal: 'best', label: '★' });

  goals.forEach((goal) => {
    const done = me.today >= goal.count;
    const item = create('li', done ? 'is-done' : '');
    item.append(
      create('span', `medal medal-${goal.medal}`, goal.label),
      create('span', 'name', goal.name),
      create('span', 'left', done ? 'Earned' : `${goal.count - me.today} to go`)
    );
    list.append(item);
  });
}

function showTeam(team, colleges) {
  const tiles = document.getElementById('team-tiles');
  [
    ['Registrations', String(team.today), 'Across all three colleges'],
    ['Against usual pace', percent(team.today, team.usualByNow), `Usually ${team.usualByNow} by now`],
    ['People registering', String(team.registering), `Out of ${team.people} in the team`]
  ].forEach(([label, value, note]) => {
    const tile = create('div', 'tile');
    tile.append(create('span', '', label), create('b', '', value), create('small', '', note));
    tiles.append(tile);
  });

  const list = document.getElementById('colleges');
  colleges.forEach((college) => {
    const scale = Math.max(college.today, college.usualByNow) * 1.2;
    const item = create('li');
    const top = create('div', 'college-top');
    top.append(create('span', '', college.name), create('b', '', String(college.today)));

    const meter = create('div', 'meter');
    const fill = create('div', 'meter-fill');
    const mark = create('div', 'meter-mark');
    fill.style.width = `${(college.today / scale) * 100}%`;
    mark.style.left = `${(college.usualByNow / scale) * 100}%`;
    meter.append(fill, mark);

    item.append(top, meter, create('p', 'college-note', `${percent(college.today, college.usualByNow)} of the usual ${college.usualByNow} by now`));
    list.append(item);
  });
}

function showWeek(me) {
  const chart = document.getElementById('week-chart');
  const days = document.getElementById('week-days');
  const top = Math.max(me.usualDay, ...me.week.filter((day) => day !== null)) * 1.25;

  me.week.forEach((value, index) => {
    const bar = create('div', 'week-bar');
    if (value === null) {
      bar.classList.add('is-future');
      bar.append(create('span', '', '–'));
    } else {
      bar.style.height = `${(value / top) * 100}%`;
      bar.append(create('span', '', String(value)));
      if (index === me.todayIndex) bar.classList.add('is-today');
    }
    bar.title = value === null ? `${WEEK_DAYS[index]}: still to come` : `${WEEK_DAYS[index]}: ${value}`;
    chart.append(bar);
    days.append(create('span', '', WEEK_DAYS[index]));
  });

  const average = create('div', 'week-average');
  average.style.bottom = `${(me.usualDay / top) * 100}%`;
  chart.append(average);
}

function showWins(wins) {
  const list = document.getElementById('wins');
  wins.forEach((win) => {
    const item = create('li');
    const text = create('div');
    text.append(create('b', '', win.name), create('small', '', win.detail));
    item.append(create('span', 'avatar', initials(win.name)), text, create('time', '', win.time));
    list.append(item);
  });
}

function setUpMenu() {
  const app = document.getElementById('app');
  const button = document.getElementById('menu-button');
  const setOpen = (open) => {
    app.classList.toggle('menu-open', open);
    button.setAttribute('aria-expanded', String(open));
  };

  button.addEventListener('click', () => setOpen(!app.classList.contains('menu-open')));
  document.getElementById('scrim').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });

  document.getElementById('sign-out').addEventListener('click', () => {
    endSession();
    location.href = 'index.html';
  });
}

const user = readSession();

if (user) {
  showUser(user);
  showMyDay(SAMPLE.me);
  showMilestones(SAMPLE.me);
  showTeam(SAMPLE.team, SAMPLE.colleges);
  showWeek(SAMPLE.me);
  showWins(SAMPLE.wins);
  setUpMenu();
}
