const PERIOD_OPTIONS = Object.entries(PERIODS).map(([key, period]) => [key, period.label]);

const user = setUpShell();
const state = {
  // Only a manager can look at someone else's progress
  person: (user.manager ? recall('person') : null) || user.person || user.name,
  period: PERIODS[recall('period')] ? recall('period') : 'today'
};

function fillFigures(list, rows) {
  list.replaceChildren();
  rows.forEach(([term, value]) => {
    const row = create('div');
    row.append(create('dt', '', term), create('dd', '', value));
    list.append(row);
  });
}

function addMarker(track, className, value, scale) {
  const marker = create('span', `track-marker ${className}`);
  marker.style.left = `${Math.min(100, (value / scale) * 100)}%`;
  track.append(marker);
}

function showHeader(person) {
  document.getElementById('person-picker').hidden = !user.manager;
  document.getElementById('person-name').textContent = person.name;
  document.getElementById('person-note').textContent = `${person.college} · ${PERIODS[state.period].note}`;
  document.getElementById('snapshot-time').textContent = SNAPSHOT.time;

  const select = document.getElementById('person-select');
  if (!select.options.length) {
    COLLEGES.forEach((college) => {
      const group = create('optgroup');
      group.label = college;
      PEOPLE.filter((someone) => someone.college === college).forEach((someone) => {
        group.append(new Option(someone.name, someone.name));
      });
      select.append(group);
    });
    select.addEventListener('change', () => choosePerson(select.value));
  }
  select.value = person.name;

  buildSegmented(document.getElementById('period-picker'), PERIOD_OPTIONS, state.period, (period) => {
    state.period = period;
    remember('period', period);
    render();
  });
}

function showRegistrations(person, figures) {
  const period = PERIODS[state.period];
  const inProgress = state.period !== 'yesterday';

  document.getElementById('registrations-status').replaceChildren(statusChip(paceFor(figures, state.period)));
  document.getElementById('registrations-count').textContent = String(figures.count);
  document.getElementById('registrations-label').textContent = figures.count === 1 ? 'registration' : 'registrations';

  const track = document.getElementById('registrations-track');
  track.replaceChildren();
  const scale = Math.max(figures.count, figures.august, 1) * 1.15;
  const fill = create('span', 'track-fill');
  fill.style.width = `${(figures.count / scale) * 100}%`;
  track.append(fill);
  addMarker(track, 'is-august', figures.august, scale);
  if (inProgress) addMarker(track, 'is-now', figures.byNow, scale);

  const legend = document.getElementById('registrations-legend');
  legend.replaceChildren();
  const key = (className, text) => {
    const item = create('span');
    item.append(create('i', className), document.createTextNode(text));
    legend.append(item);
  };
  key('key-fill', 'So far');
  key('key-august', period.days === 1 ? 'August daily average' : `August average for ${period.days} days`);
  if (inProgress) key('key-now', `Usually by ${SNAPSHOT.time}`);

  const rows = [['Per day in August', formatNumber(person.august)]];
  if (period.days > 1) rows.push([`August average for ${period.days} days`, formatNumber(figures.august)]);
  if (inProgress) rows.push([`Usually by ${SNAPSHOT.time}`, formatNumber(figures.byNow)]);
  rows.push(['Compared with August', describeChange(figures.count, figures.august)]);
  fillFigures(document.getElementById('registrations-figures'), rows);
}

function showRecord(figures) {
  const unit = PERIODS[state.period].unit;
  const record = document.getElementById('record');
  record.replaceChildren();

  if (figures.count > figures.previousBest) {
    record.append(create('b', '', 'New record'), create('span', '', `A new best ${unit} since August. Worth a celebration.`));
  } else {
    const needed = figures.previousBest + 1 - figures.count;
    record.append(create('b', '', `${needed} more`), create('span', '', `for a new best ${unit} since August`));
  }

  fillFigures(document.getElementById('record-figures'), [
    [`Previous best ${unit}`, String(figures.previousBest)],
    ['So far', String(figures.count)]
  ]);
}

function showCash(person, figures) {
  const unit = PERIODS[state.period].unit;
  document.getElementById('cash-amount').textContent = formatMoney(figures.cash);

  fillFigures(document.getElementById('cash-figures'), [
    [PERIODS[state.period].days === 1 ? 'Per day in August' : `August pace for ${PERIODS[state.period].days} days`,
      person.cashAugust ? formatMoney(figures.cashAugust) : 'No August cash'],
    ['Previous day cash best', person.cashBest ? formatMoney(person.cashBest) : 'None yet']
  ]);

  document.getElementById('cash-milestones-title').textContent =
    unit === 'day' ? 'Daily milestones' : unit === 'week' ? 'Weekly milestones' : 'Monthly milestones';

  const chips = document.getElementById('cash-milestones');
  chips.replaceChildren();
  CASH_MILESTONES[unit].forEach((amount) => {
    const reached = figures.cash >= amount;
    const label = amount === 1 ? 'First payment' : `R${amount.toLocaleString('en-ZA')}`;
    const chip = create('span', reached ? 'chip is-reached' : 'chip');
    if (reached) chip.append(icon(ICONS.check, 14));
    chip.append(document.createTextNode(label));
    chips.append(chip);
  });
}

// Cards ready is for managers, so everyone else is pointed at the wall of fame
function cardsLink() {
  const link = create('a', 'text-link', user.manager ? 'Open cards ready' : 'See the wall of fame');
  link.href = user.manager ? 'cards.html' : 'fame.html';
  return link;
}

function showLatestCard(person) {
  const holder = document.getElementById('latest-card');
  holder.replaceChildren();
  const card = latestCardFor(person);

  if (!card) {
    holder.append(create('p', 'empty', 'No celebrations yet this month. The first registration earns a Bronze card.'));
    return;
  }

  const preview = create('div', 'mini-card');
  preview.append(
    create('span', `mini-card-tier tier-${card.tier.toLowerCase()}`, `${card.label} · ${card.tier}`),
    create('b', '', String(card.count)),
    create('span', '', card.unit),
    create('small', '', card.date)
  );

  const footer = create('div', 'card-footer');
  footer.append(
    create('span', `status ${card.status === 'Sent' ? 'status-good' : 'status-info'}`, card.status),
    cardsLink()
  );
  holder.append(preview, footer);
}

const rands = (value) => `R${value.toLocaleString('en-ZA')}`;

// Incentives are weekly, so they don't change with the period picker
function showIncentives(person) {
  const incentives = incentivesFor(person);
  document.getElementById('incentive-week').textContent = `${INCENTIVE_WEEK} · weekly amounts, whatever period is chosen above`;
  document.getElementById('incentive-paid').replaceChildren(
    statusChip(incentives.paid ? { tone: 'good', text: 'Marked as paid' } : { tone: 'waiting', text: 'Not marked as paid' })
  );

  fillFigures(document.getElementById('incentive-lines'), [
    ['Weekly enrolment incentive', formatMoney(incentives.enrolment)],
    ['Additional cash incentive', formatMoney(incentives.cash)],
    ['Registration fees and referrals', formatMoney(incentives.fees)],
    ['Total recorded this week', formatMoney(incentives.total)]
  ]);

  document.getElementById('incentive-qualifying').textContent = String(incentives.qualifying);

  // Show the stretch from the level already reached to the next one
  const track = document.getElementById('incentive-track');
  track.replaceChildren();
  const from = incentives.current ? incentives.current[0] : 0;
  const to = incentives.next ? incentives.next[0] : from;
  const fill = create('span', 'track-fill');
  fill.style.width = incentives.next ? `${((incentives.qualifying - from) / (to - from)) * 100}%` : '100%';
  const start = create('span', 'level-end', incentives.current ? `${from} · ${rands(incentives.current[1])}` : '0 · R0');
  const end = create('span', 'level-end level-end-next', incentives.next ? `${to} · ${rands(incentives.next[1])}` : 'Top level');
  const bar = create('div', 'track');
  bar.append(fill);
  track.append(bar, start, end);

  const firstName = person.name.split(' ')[0];
  const nudge = document.getElementById('incentive-nudge');
  if (incentives.next) {
    const needed = incentives.next[0] - incentives.qualifying;
    const extra = incentives.next[1] - incentives.enrolment;
    nudge.textContent = `${firstName}, ${needed} more qualifying enrolment${needed === 1 ? ' reaches' : 's reach'} the ${rands(incentives.next[1])} weekly level. That's another ${rands(extra)} in enrolment incentive.`;
  } else {
    nudge.textContent = `${firstName} has reached the top weekly level of ${rands(incentives.enrolment)}.`;
  }

  const levels = document.getElementById('incentive-levels');
  if (!levels.children.length) {
    INCENTIVE_LEVELS.forEach(([count, amount]) => levels.append(create('li', '', `${count} enrolments · ${rands(amount)}`)));
  }
}

function showLeague(person) {
  document.getElementById('league-name').textContent = person.league;
  const list = document.getElementById('league');
  list.replaceChildren();

  PEOPLE.filter((someone) => someone.league === person.league)
    .map((someone) => ({ someone, figures: figuresFor(someone, state.period) }))
    .sort((a, b) => b.figures.count / Math.max(b.figures.august, 0.1) - a.figures.count / Math.max(a.figures.august, 0.1))
    .forEach(({ someone, figures }) => {
      const item = create('li', someone.name === person.name ? 'is-selected' : '');
      const who = create('div');
      if (user.manager) {
        const name = create('button', 'person-link', someone.name);
        name.type = 'button';
        name.dataset.focus = `league:${someone.name}`;
        name.addEventListener('click', () => keepFocus(() => choosePerson(someone.name)));
        who.append(name);
      } else {
        who.append(create('b', '', someone.name));
      }
      who.append(create('small', '', `August ${formatNumber(figures.august)} · ${describeChange(figures.count, figures.august)}`));

      const now = create('div', 'now');
      now.append(create('b', '', String(figures.count)));
      // Colleagues only show the good news unless you're a manager or it's your own row
      const pace = paceFor(figures, state.period);
      const mine = someone.name === (user.person || user.name);
      if (user.manager || mine || ['best', 'good', 'info'].includes(pace.tone)) now.append(statusChip(pace));
      item.append(create('span', 'avatar avatar-soft', initials(someone.name)), who, now);
      list.append(item);
    });
}

function showColleges() {
  const list = document.getElementById('colleges');
  list.replaceChildren();
  const inProgress = state.period !== 'yesterday';

  COLLEGES.forEach((college) => {
    const totals = PEOPLE.filter((someone) => someone.college === college)
      .map((someone) => figuresFor(someone, state.period))
      .reduce((sum, figures) => ({
        count: sum.count + figures.count,
        august: sum.august + figures.august,
        byNow: sum.byNow + figures.byNow
      }), { count: 0, august: 0, byNow: 0 });

    const scale = Math.max(totals.count, totals.august, 1) * 1.15;
    const item = create('li');
    const top = create('div', 'college-top');
    top.append(create('span', '', college), create('b', '', String(totals.count)));

    const meter = create('div', 'track track-small');
    const fill = create('span', 'track-fill');
    fill.style.width = `${(totals.count / scale) * 100}%`;
    meter.append(fill);
    addMarker(meter, 'is-august', totals.august, scale);
    if (inProgress) addMarker(meter, 'is-now', totals.byNow, scale);

    const note = inProgress
      ? `${formatPercent(totals.count, totals.august)} of August average · usually ${formatNumber(totals.byNow)} by now`
      : `${formatPercent(totals.count, totals.august)} of August average (${formatNumber(totals.august)})`;
    item.append(top, meter, create('p', 'college-note', note));
    list.append(item);
  });
}

function choosePerson(name) {
  state.person = findPerson(name).name;
  remember('person', state.person);
  render();
}

// The three answers people look for first, before the detail below
function showSummary(person, figures) {
  const period = PERIODS[state.period];
  document.getElementById('summary-period').textContent = `Registrations · ${period.label.toLowerCase()}`;
  document.getElementById('summary-count').textContent = String(figures.count);
  document.getElementById('summary-pace').replaceChildren(statusChip(paceFor(figures, state.period)));

  const streak = streakFor(person);
  const streakLink = document.getElementById('summary-streak');
  streakLink.hidden = streak.current < 2;
  streakLink.replaceChildren(
    icon(['M12 22c4 0 7-2.8 7-7 0-3.5-2.5-6-4-8-.5 2-1.5 3-3 3 0-3-1-6-4-8 0 4-3 6.5-3 11 0 4.2 3 9 7 9z'], 16),
    document.createTextNode(`${streak.current}-day sales streak`)
  );

  const needed = figures.previousBest + 1 - figures.count;
  document.getElementById('summary-record').textContent = needed > 0 ? `${needed} more` : 'New best';
  document.getElementById('summary-record-note').textContent = needed > 0
    ? `to beat your best ${period.unit} of ${figures.previousBest}`
    : `You beat your best ${period.unit} of ${figures.previousBest}`;

  const incentives = incentivesFor(person);
  document.getElementById('summary-incentive').textContent = formatMoney(incentives.total);
  const toGo = incentives.next ? incentives.next[0] - incentives.qualifying : 0;
  document.getElementById('summary-incentive-note').textContent = incentives.next
    ? `${toGo} more enrolment${toGo === 1 ? '' : 's'} for the ${rands(incentives.next[1])} level`
    : 'Top weekly level reached';
}

function render() {
  const person = findPerson(state.person);
  const figures = figuresFor(person, state.period);
  showHeader(person);
  showSummary(person, figures);
  showRegistrations(person, figures);
  showRecord(figures);
  showCash(person, figures);
  showLatestCard(person);
  showIncentives(person);
  showLeague(person);
  showColleges();
}

render();
