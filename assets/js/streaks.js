setUpShell();

const state = { college: recall('streaks-college') || 'All' };

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

function streakRow({ person, streak }) {
  const item = create('li', person.name === (readSession().person || readSession().name) ? 'is-selected' : '');
  const who = create('div');
  const from = [...STREAK_MILESTONES].reverse().find((milestone) => milestone <= streak.current) || 0;
  const track = create('div', 'track track-small');
  const fill = create('span', 'track-fill');
  fill.style.width = streak.next ? `${((streak.current - from) / (streak.next - from)) * 100}%` : '100%';
  track.append(fill);

  const nextText = streak.next
    ? `${plural(streak.next - streak.current, 'more day')} for the ${streak.next}-day card`
    : streak.current === 20 ? 'Reached the 20-day card' : 'Past the 20-day card';
  who.append(
    create('b', '', person.name),
    track,
    create('small', '', streak.waitingToday ? `${nextText} · no sale yet today` : `${person.college} · ${nextText}`)
  );

  const now = create('div', 'now');
  now.append(create('b', '', String(streak.current)), create('small', '', streak.current === 1 ? 'day' : 'days'));
  if (STREAK_MILESTONES.includes(streak.current) && !streak.waitingToday) {
    now.append(statusChip({ tone: 'best', text: 'Card today' }));
  }

  const flame = create('span', 'avatar avatar-streak');
  flame.append(icon(['M12 22c4 0 7-2.8 7-7 0-3.5-2.5-6-4-8-.5 2-1.5 3-3 3 0-3-1-6-4-8 0 4-3 6.5-3 11 0 4.2 3 9 7 9z'], 20));
  item.append(flame, who, now);
  return item;
}

function render() {
  document.getElementById('snapshot-time').textContent = SNAPSHOT.time;
  document.getElementById('streaks-college').value = state.college;

  const rows = PEOPLE.filter((person) => state.college === 'All' || person.college === state.college)
    .map((person) => ({ person, streak: streakFor(person) }));
  const running = rows.filter(({ streak }) => streak.current >= 2)
    .sort((a, b) => b.streak.current - a.streak.current || a.person.name.localeCompare(b.person.name));

  document.getElementById('streaks-note').textContent =
    `${state.college === 'All' ? 'All colleges' : state.college} · ${running.length === 1 ? '1 person' : `${running.length} people`} on a streak of 2 days or more`;

  const list = document.getElementById('streak-list');
  list.replaceChildren();
  if (!running.length) list.append(create('li', 'empty', 'No one is on a streak yet. One sale today and tomorrow starts one.'));
  running.forEach((row) => list.append(streakRow(row)));

  const longest = document.getElementById('longest-list');
  longest.replaceChildren();
  rows.filter(({ streak }) => streak.longest >= 2)
    .sort((a, b) => b.streak.longest - a.streak.longest || a.person.name.localeCompare(b.person.name))
    .slice(0, 5)
    .forEach(({ person, streak }) => {
      const item = create('li');
      const who = create('span');
      who.append(create('b', '', person.name), create('small', '', person.college));
      item.append(who, create('span', 'longest-days', plural(streak.longest, 'day')));
      longest.append(item);
    });

  const chips = document.getElementById('streak-milestones');
  chips.replaceChildren();
  STREAK_MILESTONES.forEach((milestone) => {
    const reached = rows.filter(({ streak }) => streak.current >= milestone).length;
    const chip = create('span', reached ? 'chip is-reached' : 'chip');
    if (reached) chip.append(icon(ICONS.check, 14));
    chip.append(document.createTextNode(`${milestone} days · ${reached === 1 ? '1 person' : `${reached} people`}`));
    chips.append(chip);
  });
}

document.getElementById('streaks-college').addEventListener('change', (event) => {
  state.college = event.target.value;
  remember('streaks-college', state.college);
  render();
});

render();
