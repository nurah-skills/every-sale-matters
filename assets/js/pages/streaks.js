const user = setUpShell();

const state = { college: recall('streaks-college') || 'All' };

// Cards ready is for managers
document.getElementById('streak-cards-link').hidden = !user.manager;

const BANDS = [
  [20, Infinity, '20 days or more'],
  [10, 19, '10 to 19 days'],
  [5, 9, '5 to 9 days'],
  [2, 4, '2 to 4 days']
];
const FLAME = ['M12 22c4 0 7-2.8 7-7 0-3.5-2.5-6-4-8-.5 2-1.5 3-3 3 0-3-1-6-4-8 0 4-3 6.5-3 11 0 4.2 3 9 7 9z'];

const days = (count) => `${count} day${count === 1 ? '' : 's'}`;
const people = (count) => (count === 1 ? '1 person' : `${count} people`);

function nextText(streak) {
  if (streak.next) return `${days(streak.next - streak.current)} to the ${streak.next}-day card`;
  return streak.current === 20 ? 'Reached the 20-day card' : 'Past the 20-day card';
}

// A card is made on the day the streak reaches 5, 10 or 20 with a sale already in
const cardToday = (row) => STREAK_MILESTONES.includes(row.streak.current) && !row.streak.waitingToday;

function showToday(rows) {
  const today = rows.filter(cardToday).sort((a, b) => b.streak.current - a.streak.current);
  document.getElementById('streak-today').hidden = !today.length;
  const grid = document.getElementById('streak-today-grid');
  grid.replaceChildren();
  today.forEach(({ person, streak }) => {
    const card = create('article', 'streak-card');
    const count = create('p', 'streak-card-count');
    count.append(icon(FLAME, 22), create('b', '', String(streak.current)), create('span', '', 'days in a row'));
    card.append(count, create('h3', '', person.name), create('p', 'panel-note', `${person.college} · ${streak.current}-day streak card ready`));
    grid.append(card);
  });
}

function streakRow({ person, streak }) {
  const me = person.name === (user.person || user.name);
  const item = create('li', me ? 'streak-row is-me' : 'streak-row');

  const who = create('div', 'streak-who');
  who.append(create('b', '', person.name), create('small', '', person.college));

  const from = [...STREAK_MILESTONES].reverse().find((milestone) => milestone <= streak.current) || 0;
  const progress = create('div', 'streak-progress');
  const track = create('div', 'track track-small');
  const fill = create('span', 'track-fill');
  fill.style.width = streak.next ? `${((streak.current - from) / (streak.next - from)) * 100}%` : '100%';
  track.append(fill);
  progress.append(track, create('small', '', streak.waitingToday ? `${nextText(streak)} · no sale yet today` : nextText(streak)));

  const count = create('p', 'streak-count');
  count.append(create('b', '', String(streak.current)), create('span', '', streak.current === 1 ? 'day' : 'days'));

  item.append(who, progress, count);
  return item;
}

function showBands(running) {
  const holder = document.getElementById('streak-bands');
  holder.replaceChildren();
  if (!running.length) {
    holder.append(create('p', 'empty', 'No one is on a streak yet. A sale today and tomorrow starts one.'));
    return;
  }

  BANDS.forEach(([low, high, label]) => {
    const band = running.filter(({ streak }) => streak.current >= low && streak.current <= high);
    if (!band.length) return;
    const section = create('section', 'streak-band');
    const head = create('div', 'streak-band-head');
    head.append(create('h3', '', label), create('span', 'panel-note', people(band.length)));
    const list = create('ul', 'streak-rows');
    band.forEach((row) => list.append(streakRow(row)));
    section.append(head, list);
    holder.append(section);
  });
}

function render() {
  document.getElementById('snapshot-time').textContent = SNAPSHOT.time;
  document.getElementById('streaks-college').value = state.college;

  const rows = PEOPLE.filter((person) => state.college === 'All' || person.college === state.college)
    .map((person) => ({ person, streak: streakFor(person) }));
  const running = rows.filter(({ streak }) => streak.current >= 2)
    .sort((a, b) => b.streak.current - a.streak.current || a.person.name.localeCompare(b.person.name));

  document.getElementById('streaks-note').textContent =
    `${state.college === 'All' ? 'All colleges' : state.college} · ${people(running.length)} on a streak of 2 days or more`;

  showToday(rows);
  showBands(running);

  const longest = document.getElementById('longest-list');
  longest.replaceChildren();
  rows.filter(({ streak }) => streak.longest >= 2)
    .sort((a, b) => b.streak.longest - a.streak.longest || a.person.name.localeCompare(b.person.name))
    .slice(0, 5)
    .forEach(({ person, streak }) => {
      const item = create('li');
      const who = create('span');
      who.append(create('b', '', person.name), create('small', '', person.college));
      item.append(who, create('span', 'longest-days', days(streak.longest)));
      longest.append(item);
    });

  const chips = document.getElementById('streak-milestones');
  chips.replaceChildren();
  STREAK_MILESTONES.forEach((milestone) => {
    const reached = rows.filter(({ streak }) => streak.current >= milestone).length;
    const chip = create('span', reached ? 'chip is-reached' : 'chip');
    if (reached) chip.append(icon(ICONS.check, 14));
    chip.append(document.createTextNode(`${milestone} days · ${people(reached)}`));
    chips.append(chip);
  });
}

document.getElementById('streaks-college').addEventListener('change', (event) => {
  state.college = event.target.value;
  remember('streaks-college', state.college);
  render();
});

render();
