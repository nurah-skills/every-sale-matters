setUpShell();

const VIEWS = [['gallery', 'Gallery'], ['calendar', 'Calendar']];
const DAYS_PER_STEP = 4;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const state = {
  view: recall('fame-view') === 'calendar' ? 'calendar' : 'gallery',
  college: recall('fame-college') || 'All',
  person: recall('fame-person') || 'all',
  shownDays: DAYS_PER_STEP,
  day: TODAY,
  previewing: null
};

const matches = (name, college) =>
  (state.college === 'All' || college === state.college) && (state.person === 'all' || name === state.person);

// Weekly and monthly cards come after the most recent full day, not ahead of it
const sortDay = (card) => (card.date.includes(' to ') ? TODAY - 1.5 : card.day ?? TODAY);

// Everything sent this month: cards from earlier days plus the ones marked as sent in Cards ready
function sentCards() {
  const recent = cardsWithStatus().filter((card) => card.status === 'sent');
  const ids = new Set(recent.map((card) => card.id));
  return [...recent, ...pastCards().filter((card) => !ids.has(card.id))]
    .filter((card) => matches(card.person, card.college))
    .sort((a, b) => sortDay(b) - sortDay(a) || KIND_ORDER[a.lead.kind] - KIND_ORDER[b.lead.kind]);
}

function fillPeople() {
  const select = document.getElementById('fame-person');
  const people = PEOPLE.filter((person) => state.college === 'All' || person.college === state.college)
    .sort((a, b) => a.name.localeCompare(b.name));
  if (state.person !== 'all' && !people.some((person) => person.name === state.person)) state.person = 'all';
  select.replaceChildren(new Option('Everyone', 'all'), ...people.map((person) => new Option(person.name, person.name)));
  select.value = state.person;
}

async function openPreview(card) {
  state.previewing = card;
  const dialog = document.getElementById('card-preview');
  const image = document.getElementById('preview-image');
  document.getElementById('preview-title').textContent = `${card.person} · ${card.lead.title}`;
  document.getElementById('preview-caption').value = captionFor(card);
  const blank = create('canvas', image.className);
  blank.id = image.id;
  image.replaceWith(blank);
  if (!dialog.open) dialog.showModal();
  showCanvas(blank, await drawCard(card), `${card.lead.title} card for ${card.person}`);
}

function fameCard(card) {
  const button = create('button', 'fame-card');
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'dialog');

  const art = create('span', `card-art kind-${card.lead.kind}`);
  const pill = create('span', 'card-pill', pillText(card));
  pill.style.background = pillColour(card);
  pill.style.color = pillTextColour(card);
  art.append(pill, create('b', '', shortValueText(card.lead)), create('span', '', card.lead.unit));

  const body = create('span', 'fame-card-body');
  body.append(create('b', '', card.person), create('span', '', card.lead.title), create('small', '', card.college));
  button.append(art, body);
  button.addEventListener('click', () => openPreview(card));
  return button;
}

function showGallery(cards) {
  const holder = document.getElementById('fame-days');
  holder.replaceChildren();

  if (!cards.length) {
    holder.append(create('p', 'empty', 'No cards sent for this selection yet.'));
    document.getElementById('fame-more').hidden = true;
    return;
  }

  // Cards come sorted newest first, so each date forms one group
  const groups = [];
  cards.forEach((card) => {
    const last = groups[groups.length - 1];
    if (last && last.date === card.date) last.cards.push(card);
    else groups.push({ date: card.date, cards: [card] });
  });

  groups.slice(0, state.shownDays).forEach((group) => {
    const section = create('section', 'fame-day');
    const heading = create('h3', '', group.date.replace(' 2026', ''));
    const count = create('span', 'panel-note', `${group.cards.length} card${group.cards.length === 1 ? '' : 's'}`);
    const top = create('div', 'fame-day-head');
    top.append(heading, count);
    const grid = create('div', 'fame-grid');
    group.cards.forEach((card) => grid.append(fameCard(card)));
    section.append(top, grid);
    holder.append(section);
  });

  document.getElementById('fame-more').hidden = groups.length <= state.shownDays;
}

function eventsOn(day) {
  return milestonesOn(day).filter(({ person }) => matches(person.name, person.college));
}

const eventType = (win) => (win.kind === 'best' ? 'best' : win.kind === 'streak' ? 'streak' : 'level');

function showCalendar() {
  const table = document.getElementById('calendar');
  table.querySelectorAll('thead, tbody').forEach((part) => part.remove());

  const head = create('thead');
  const headRow = create('tr');
  WEEKDAYS.forEach((name) => {
    const cell = create('th', '', name);
    cell.scope = 'col';
    headRow.append(cell);
  });
  head.append(headRow);

  // September 2026 starts on a Tuesday, so the first row begins with Monday 31 August
  const body = create('tbody');
  let row;
  for (let date = 0; date <= 30; date += 1) {
    if (date % 7 === 0) {
      row = create('tr');
      body.append(row);
    }
    const cell = create('td');
    const day = WORKDAYS.indexOf(date);
    if (date === 0) {
      cell.className = 'calendar-off';
    } else if (day === -1) {
      cell.className = 'calendar-off';
      cell.append(create('span', 'calendar-date', String(date)));
    } else {
      const events = eventsOn(day);
      const button = create('button', 'calendar-day');
      button.type = 'button';
      button.dataset.focus = `day:${day}`;
      button.setAttribute('aria-pressed', String(day === state.day));
      button.setAttribute('aria-label', `${dayName(day)}: ${events.length} milestone${events.length === 1 ? '' : 's'}`);
      const dots = create('span', 'calendar-dots');
      ['best', 'streak', 'level'].forEach((type) => {
        if (events.some(({ win }) => eventType(win) === type)) dots.append(create('i', `dot dot-${type}`));
      });
      button.append(create('span', 'calendar-date', String(date)), dots, create('span', 'calendar-count', events.length ? String(events.length) : ''));
      button.addEventListener('click', () => keepFocus(() => {
        state.day = day;
        showCalendar();
      }));
      cell.append(button);
    }
    row.append(cell);
  }
  while (row.children.length < 7) row.append(create('td', 'calendar-off'));
  table.append(head, body);
  showDay();
}

function showDay() {
  const holder = document.getElementById('calendar-detail');
  holder.replaceChildren();
  const events = eventsOn(state.day).sort((a, b) => KIND_ORDER[a.win.kind] - KIND_ORDER[b.win.kind]);
  holder.append(create('h3', '', dayName(state.day).replace(' 2026', '')));

  if (!events.length) {
    holder.append(create('p', 'empty', 'No big milestones on this day for this selection.'));
    return;
  }

  const tones = { best: 'best', streak: 'changed', level: 'good' };
  const list = create('ul', 'league');
  events.forEach(({ person, win }) => {
    const item = create('li');
    const who = create('div');
    who.append(create('b', '', person.name), create('small', '', person.college));
    const now = create('div', 'now');
    now.append(statusChip({ tone: tones[eventType(win)], text: win.title }));
    item.append(create('span', 'avatar avatar-soft', initials(person.name)), who, now);
    list.append(item);
  });
  holder.append(list);
}

function render() {
  const cards = sentCards();
  document.getElementById('snapshot-time').textContent = SNAPSHOT.time;
  document.getElementById('fame-note').textContent = `${cards.length} card${cards.length === 1 ? '' : 's'} sent from 1 to 17 September`;
  document.getElementById('fame-college').value = state.college;
  fillPeople();

  buildSegmented(document.getElementById('fame-view'), VIEWS, state.view, (view) => {
    state.view = view;
    remember('fame-view', view);
    render();
  });

  document.getElementById('fame-gallery').hidden = state.view !== 'gallery';
  document.getElementById('fame-calendar').hidden = state.view !== 'calendar';
  if (state.view === 'gallery') showGallery(cards);
  else showCalendar();
}

document.getElementById('fame-college').addEventListener('change', (event) => {
  state.college = event.target.value;
  state.shownDays = DAYS_PER_STEP;
  remember('fame-college', state.college);
  render();
});

document.getElementById('fame-person').addEventListener('change', (event) => {
  state.person = event.target.value;
  state.shownDays = DAYS_PER_STEP;
  remember('fame-person', state.person);
  render();
});

document.getElementById('fame-more').addEventListener('click', () => {
  const shown = document.querySelectorAll('.fame-day').length;
  state.shownDays += DAYS_PER_STEP;
  render();
  // Move focus to the first newly shown card so keyboard users carry on from there
  const next = document.querySelectorAll('.fame-day')[shown];
  if (next) next.querySelector('.fame-card').focus();
});

document.getElementById('close-preview').addEventListener('click', () => document.getElementById('card-preview').close());
document.getElementById('preview-download').addEventListener('click', () => state.previewing && downloadCard(state.previewing));
document.getElementById('preview-copy').addEventListener('click', async () => {
  if (await copyText(document.getElementById('preview-caption').value)) {
    showToast('Caption copied');
    return;
  }
  document.getElementById('preview-caption').select();
  showToast('Copying was blocked. The caption is selected so you can copy it yourself.');
});
document.getElementById('card-preview').addEventListener('click', (event) => {
  if (event.target.id === 'card-preview') event.target.close();
});

render();
