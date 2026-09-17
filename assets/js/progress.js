setUpShell();

const REVIEW_KEY = 'esm-review';
const MONDAYS = [7, 14, 21, 28];
const QUESTIONS = [
  { key: 'encouraged', label: 'Feel encouraged' },
  { key: 'fair', label: 'Feels fair' }
];

function readReview() {
  try {
    return JSON.parse(localStorage.getItem(REVIEW_KEY)) || { start: null, responses: [] };
  } catch {
    return { start: null, responses: [] };
  }
}

function saveReview(review) {
  try {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(review));
    return true;
  } catch {
    return false;
  }
}

const dateLabel = (day) => (day > 30 ? `${day - 30} October` : `${day} September`);

function weekFigures(startDay, weekIndex) {
  const monday = startDay + weekIndex * 7;
  const friday = monday + 4;
  const indexes = WORKDAYS.map((day, index) => [day, index]).filter(([day]) => day >= monday && day <= friday).map(([, index]) => index);
  const state = monday > WORKDAYS[TODAY] ? 'upcoming' : friday < WORKDAYS[TODAY] ? 'complete' : 'current';

  let count = 0;
  let august = 0;
  let above = 0;
  PEOPLE.forEach((person) => {
    const personCount = indexes.reduce((sum, index) => sum + person.days[index], 0);
    // Today only counts for the part of the working day that has passed
    const days = indexes.reduce((sum, index) => sum + (index === TODAY ? SNAPSHOT.dayFraction : 1), 0);
    count += personCount;
    august += person.august * days;
    if (days && personCount >= person.august * days) above += 1;
  });

  return { number: weekIndex + 1, monday, friday, state, count, august, above };
}

function showWeeks(startDay) {
  const holder = document.getElementById('weeks');
  holder.replaceChildren();
  const labels = { complete: ['good', 'Complete'], current: ['info', 'This week'], upcoming: ['waiting', 'Upcoming'] };

  [0, 1, 2, 3].forEach((weekIndex) => {
    const week = weekFigures(startDay, weekIndex);
    const card = create('article', `week-card is-${week.state}`);
    const top = create('div', 'panel-head');
    top.append(create('h2', '', `Week ${week.number}`), statusChip({ tone: labels[week.state][0], text: labels[week.state][1] }));
    card.append(top, create('p', 'panel-note', `${dateLabel(week.monday)} to ${dateLabel(week.friday)}`));

    if (week.state === 'upcoming') {
      card.append(create('p', 'week-empty', 'Results show once the week starts.'));
    } else {
      card.append(create('p', 'college-count', String(week.count)), create('p', 'panel-note', 'registrations'));
      const scale = Math.max(week.count, week.august, 1) * 1.15;
      const track = create('div', 'track track-small');
      const fill = create('span', 'track-fill');
      fill.style.width = `${(week.count / scale) * 100}%`;
      const mark = create('span', 'track-marker is-august');
      mark.style.left = `${(week.august / scale) * 100}%`;
      track.append(fill, mark);

      const figures = create('dl', 'figure-list');
      [
        [week.state === 'current' ? 'August pace so far' : 'August pace', formatNumber(week.august)],
        ['Compared with August', formatPercent(week.count, week.august)],
        ['People at or above August', `${week.above} of ${PEOPLE.length}`]
      ].forEach(([term, value]) => {
        const row = create('div');
        row.append(create('dt', '', term), create('dd', '', value));
        figures.append(row);
      });
      card.append(track, figures);
    }
    holder.append(card);
  });
}

function buildScale(holderId, name) {
  const holder = document.getElementById(holderId);
  holder.replaceChildren();
  [1, 2, 3, 4, 5].forEach((value) => {
    const label = create('label', 'scale-option');
    const input = create('input');
    input.type = 'radio';
    input.name = name;
    input.value = String(value);
    label.append(input, create('span', '', String(value)));
    holder.append(label);
  });
}

function showResults(responses) {
  document.getElementById('response-count').textContent = `${responses.length} response${responses.length === 1 ? '' : 's'}`;
  const holder = document.getElementById('pulse-results');
  holder.replaceChildren();

  if (!responses.length) {
    holder.append(create('p', 'empty', 'No responses yet. Results show here as people answer.'));
    return;
  }

  QUESTIONS.forEach(({ key, label }) => {
    const average = responses.reduce((sum, response) => sum + response[key], 0) / responses.length;
    const row = create('div', 'mrow');
    const top = create('div', 'college-top');
    top.append(create('span', '', label), create('b', '', `${formatNumber(Math.round(average * 10) / 10)} out of 5`));
    const track = create('div', 'track track-small');
    const fill = create('span', 'track-fill');
    fill.style.width = `${(average / 5) * 100}%`;
    track.append(fill);
    row.append(top, track);
    holder.append(row);
  });

  const comments = responses.filter((response) => response.comment).slice(-4).reverse();
  if (comments.length) {
    holder.append(create('p', 'subheading', 'Recent comments'));
    const list = create('ul', 'comments');
    comments.forEach((response) => list.append(create('li', '', response.comment)));
    holder.append(list);
  }
}

function render() {
  document.getElementById('snapshot-time').textContent = SNAPSHOT.time;
  const review = readReview();
  const started = review.start !== null;
  document.getElementById('setup-panel').hidden = started;
  document.getElementById('check').hidden = !started;
  if (!started) return;

  const lastDay = review.start + 25;
  const running = review.start <= WORKDAYS[TODAY];
  document.getElementById('check-dates').textContent = `Monday ${dateLabel(review.start)} to Friday ${dateLabel(lastDay)}`;
  document.getElementById('check-status').textContent = running ? 'Running' : 'Starts soon';
  showWeeks(review.start);
  showResults(review.responses);
}

const startSelect = document.getElementById('start-week');
MONDAYS.forEach((day) => startSelect.append(new Option(`Start on Monday ${dateLabel(day)}`, String(day))));
startSelect.value = '14';

document.getElementById('start-check').addEventListener('click', () => {
  const review = readReview();
  review.start = Number(startSelect.value);
  saveReview(review);
  render();
  showToast('The four-week check has started');
});

document.getElementById('stop-check').addEventListener('click', () => {
  const review = readReview();
  review.start = null;
  saveReview(review);
  render();
});

document.getElementById('pulse-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const error = document.getElementById('pulse-error');
  const encouraged = document.querySelector('input[name="encouraged"]:checked');
  const fair = document.querySelector('input[name="fair"]:checked');
  if (!encouraged || !fair) {
    error.textContent = 'Please choose a number for both statements.';
    error.hidden = false;
    return;
  }
  error.hidden = true;

  const review = readReview();
  review.responses.push({
    encouraged: Number(encouraged.value),
    fair: Number(fair.value),
    comment: document.getElementById('pulse-comment').value.trim()
  });
  if (!saveReview(review)) {
    error.textContent = 'Your browser is blocking storage, so this couldn\'t be saved.';
    error.hidden = false;
    return;
  }

  event.target.reset();
  showResults(review.responses);
  showToast('Thanks, your response was recorded');
});

let toastTimer;
function showToast(text) {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2800);
}

buildScale('scale-encouraged', 'encouraged');
buildScale('scale-fair', 'fair');
render();
