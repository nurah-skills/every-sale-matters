setUpShell();

const ROUNDUP_PERIODS = [['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']];

const state = {
  period: ROUNDUP_PERIODS.some(([key]) => key === recall('roundup-period')) ? recall('roundup-period') : 'daily',
  day: TODAY,
  college: 'All'
};

const valueText = (win) => (win.money ? formatMoney(win.value) : String(win.value));

function rangeFor(period, day) {
  if (period === 'monthly') return { from: 0, to: day };
  if (period === 'weekly') {
    let from = day;
    // Walk back to the Monday of that week
    while (from > 0 && (WORKDAYS[from] + 1) % 7 !== 1) from -= 1;
    return { from, to: day };
  }
  return { from: day, to: day };
}

function roundupFigures() {
  const { from, to } = rangeFor(state.period, state.day);
  const days = to - from + 1;
  // Today is still in progress, so it only counts for the part of the day that has passed
  const expectedDays = to === TODAY ? days - 1 + SNAPSHOT.dayFraction : days;

  const people = PEOPLE
    .filter((person) => state.college === 'All' || person.college === state.college)
    .map((person) => ({
      person,
      count: sumBetween(person.days, from, to),
      cash: sumBetween(person.cash, from, to),
      august: person.august * days,
      usual: person.august * expectedDays
    }));

  const bests = [];
  people.forEach(({ person }) => {
    for (let day = from; day <= to; day += 1) {
      dayWins(person, day).filter((win) => win.kind === 'best')
        .forEach((win) => bests.push(`${person.name}: ${win.title} (${valueText(win)})`));
    }
    if (state.period === 'monthly' && to === TODAY) {
      monthWins(person).filter((win) => win.kind === 'best')
        .forEach((win) => bests.push(`${person.name}: ${win.title} (${valueText(win)})`));
    }
  });

  const total = (key) => people.reduce((sum, row) => sum + row[key], 0);
  return {
    from,
    to,
    people,
    bests,
    count: total('count'),
    cash: total('cash'),
    august: total('august'),
    usual: total('usual'),
    registering: people.filter((row) => row.count > 0).length,
    above: people.filter((row) => row.count > 0 && row.count >= row.usual).map((row) => row.person.name)
  };
}

function rangeLabel(from, to) {
  if (from === to) return dayName(to);
  return `${WEEKDAY_NAMES[(WORKDAYS[from] + 1) % 7]} ${WORKDAYS[from]} to ${dayName(to)}`;
}

function buildMessage(figures) {
  const title = ROUNDUP_PERIODS.find(([key]) => key === state.period)[1];
  const lines = [];
  lines.push(`*Sales Scoreboard · ${title} round-up*`);
  lines.push(`${rangeLabel(figures.from, figures.to)}${figures.to === TODAY ? ` (so far, ${SNAPSHOT.time})` : ''}`);
  if (state.college !== 'All') lines.push(state.college);
  lines.push('');
  lines.push(`Registrations: *${figures.count}*`);
  lines.push(`Cash recorded: *R${Math.round(figures.cash).toLocaleString('en-ZA')}*`);
  lines.push(`${figures.registering} of ${figures.people.length} people have registered students`);

  if (state.college === 'All') {
    lines.push('', '*By college*');
    COLLEGES.forEach((college) => {
      const count = figures.people.filter((row) => row.person.college === college).reduce((sum, row) => sum + row.count, 0);
      lines.push(`${college}: ${count}`);
    });
  }

  const top = figures.people.filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || a.person.name.localeCompare(b.person.name))
    .slice(0, 5);
  if (top.length) {
    lines.push('', '*Most registrations*');
    top.forEach((row) => lines.push(`${row.person.name}: ${row.count}`));
  }

  if (figures.bests.length) {
    lines.push('', '*New personal bests*');
    figures.bests.forEach((line) => lines.push(line));
  }

  if (figures.above.length) {
    lines.push('', '*Ahead of their usual pace*');
    lines.push(figures.above.sort().join(', '));
  }

  lines.push('', 'Thank you, everyone. Every sale matters.');
  return lines.join('\n');
}

// Shows the message the way WhatsApp would, with *bold* turned into bold text
function showMessage(text) {
  const bubble = document.getElementById('roundup-message');
  bubble.replaceChildren();
  text.split('\n').forEach((line, index) => {
    if (index) bubble.append(document.createElement('br'));
    line.split(/(\*[^*]+\*)/).forEach((part) => {
      if (/^\*[^*]+\*$/.test(part)) bubble.append(create('strong', '', part.slice(1, -1)));
      else if (part) bubble.append(document.createTextNode(part));
    });
  });
  document.getElementById('roundup-text').value = text;
}

function showSummary(figures) {
  const rows = [
    ['Registrations', String(figures.count)],
    ['August average for this period', formatNumber(figures.august)],
    ['Compared with August', describeChange(figures.count, figures.august)],
    ['Cash recorded', formatMoney(figures.cash)],
    ['People registering', `${figures.registering} of ${figures.people.length}`],
    ['New personal bests', String(figures.bests.length)]
  ];
  if (figures.to === TODAY) rows.splice(2, 0, [`Usually by ${SNAPSHOT.time}`, formatNumber(figures.usual)]);

  const list = document.getElementById('roundup-figures');
  list.replaceChildren();
  rows.forEach(([term, value]) => {
    const row = create('div');
    row.append(create('dt', '', term), create('dd', '', value));
    list.append(row);
  });

  const colleges = document.getElementById('roundup-colleges');
  colleges.replaceChildren();
  COLLEGES.forEach((college) => {
    const rowsForCollege = figures.people.filter((row) => row.person.college === college);
    if (!rowsForCollege.length) return;
    const count = rowsForCollege.reduce((sum, row) => sum + row.count, 0);
    const august = rowsForCollege.reduce((sum, row) => sum + row.august, 0);
    const item = create('li');
    const top = create('div', 'college-top');
    top.append(create('span', '', college), create('b', '', String(count)));
    item.append(top, create('p', 'college-note', `${formatPercent(count, august)} of the August average (${formatNumber(august)})`));
    colleges.append(item);
  });
}

function render() {
  document.getElementById('snapshot-time').textContent = SNAPSHOT.time;
  buildSegmented(document.getElementById('roundup-period'), ROUNDUP_PERIODS, state.period, (period) => {
    state.period = period;
    remember('roundup-period', period);
    render();
  });

  const figures = roundupFigures();
  showMessage(buildMessage(figures));
  showSummary(figures);
}

const dateSelect = document.getElementById('roundup-date');
WORKDAYS.map((_, index) => index).reverse().forEach((index) => {
  dateSelect.append(new Option(`Up to ${WEEKDAY_NAMES[(WORKDAYS[index] + 1) % 7].slice(0, 3)} ${WORKDAYS[index]} September`, String(index)));
});
dateSelect.value = String(state.day);
dateSelect.addEventListener('change', () => {
  state.day = Number(dateSelect.value);
  render();
});

document.getElementById('roundup-college').addEventListener('change', (event) => {
  state.college = event.target.value;
  render();
});

document.getElementById('roundup-copy').addEventListener('click', async () => {
  const text = document.getElementById('roundup-text').value;
  try {
    await navigator.clipboard.writeText(text);
    showToast('Message copied');
  } catch {
    const box = document.getElementById('roundup-text');
    box.hidden = false;
    box.focus();
    box.select();
    showToast('Copying was blocked. The message is selected below so you can copy it yourself.');
  }
});

let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2800);
}

render();
