const PERIOD_OPTIONS = Object.entries(PERIODS).map(([key, period]) => [key, period.label]);

setUpShell();

const isManager = readSession().manager;

const state = {
  period: PERIODS[recall('team-period')] ? recall('team-period') : 'today',
  college: recall('team-college') || 'All',
  search: '',
  sortKey: 'count',
  sortDirection: -1,
  filter: 'all',
  group: recall('team-group') !== 'off'
};

function totalsFor(rows) {
  return rows.reduce((sum, row) => ({
    count: sum.count + row.figures.count,
    august: sum.august + row.figures.august,
    byNow: sum.byNow + row.figures.byNow,
    cash: sum.cash + row.figures.cash,
    cashAugust: sum.cashAugust + row.figures.cashAugust,
    above: sum.above + (row.figures.count > 0 && row.figures.count >= row.figures.august ? 1 : 0),
    ahead: sum.ahead + (row.figures.count > 0 && row.figures.count >= row.figures.byNow ? 1 : 0),
    bests: sum.bests + (row.figures.count > row.figures.previousBest ? 1 : 0)
  }), { count: 0, august: 0, byNow: 0, cash: 0, cashAugust: 0, above: 0, ahead: 0, bests: 0 });
}

function rowsFor(college) {
  return PEOPLE
    .filter((person) => college === 'All' || person.college === college)
    .map((person) => ({ person, figures: figuresFor(person, state.period) }));
}

function showHeader() {
  const people = rowsFor(state.college).length;
  document.getElementById('team-note').textContent =
    `${state.college === 'All' ? 'All colleges' : state.college} · ${PERIODS[state.period].note} · ${people} people`;
  document.getElementById('snapshot-time').textContent = SNAPSHOT.time;
  document.getElementById('college-select').value = state.college;

  buildSegmented(document.getElementById('period-picker'), PERIOD_OPTIONS, state.period, (period) => {
    state.period = period;
    remember('team-period', period);
    render();
  });
}

function showTiles() {
  const rows = rowsFor(state.college);
  const totals = totalsFor(rows);
  const inProgress = state.period !== 'yesterday';
  const difference = totals.count - totals.august;

  const tiles = [
    ['Registrations', String(totals.count),
      inProgress ? `Usually ${formatNumber(totals.byNow)} by ${SNAPSHOT.time}` : 'Full day'],
    ['Compared with August', formatPercent(totals.count, totals.august),
      `${totals.count} of ${formatNumber(totals.august)}`],
    ['Extra registrations vs August', `${difference > 0 ? '+' : ''}${formatNumber(difference)}`,
      difference >= 0 ? 'Ahead of the August average' : 'Still to reach the August average'],
    ['People above August', `${totals.above} of ${rows.length}`,
      inProgress ? `${totals.ahead} ahead of their usual pace` : 'Compared with their own August'],
    ['New bests since August', String(totals.bests),
      totals.bests ? 'Give these the biggest cheer' : 'None yet in this period'],
    ['Cash recorded', formatMoney(totals.cash), `August pace ${formatMoney(totals.cashAugust)}`]
  ];

  const holder = document.getElementById('team-tiles');
  holder.replaceChildren();
  tiles.forEach(([label, value, note]) => {
    const tile = create('div', 'tile');
    tile.append(create('span', '', label), create('b', '', value), create('small', '', note));
    holder.append(tile);
  });
}

function showColleges() {
  const inProgress = state.period !== 'yesterday';
  const legend = document.getElementById('college-legend');
  legend.replaceChildren();
  [['key-fill', 'Registrations'], ['key-august', 'August average'], ...(inProgress ? [['key-now', 'Usually by now']] : [])]
    .forEach(([className, text]) => {
      const item = create('span');
      item.append(create('i', className), document.createTextNode(text));
      legend.append(item);
    });

  const holder = document.getElementById('college-cards');
  holder.replaceChildren();

  COLLEGES.forEach((college) => {
    const totals = totalsFor(rowsFor(college));
    const card = create('article', `college-card${state.college === college ? ' is-selected' : ''}`);

    const top = create('div', 'college-top');
    top.append(create('span', '', college), create('span', 'panel-note', `${formatPercent(totals.count, totals.august)} of August`));

    const scale = Math.max(totals.count, totals.august, 1) * 1.15;
    const track = create('div', 'track track-small');
    const fill = create('span', 'track-fill');
    fill.style.width = `${(totals.count / scale) * 100}%`;
    track.append(fill);
    [['is-august', totals.august], ...(inProgress ? [['is-now', totals.byNow]] : [])].forEach(([className, value]) => {
      const marker = create('span', `track-marker ${className}`);
      marker.style.left = `${(value / scale) * 100}%`;
      track.append(marker);
    });

    const figures = create('dl', 'figure-list');
    [
      ['August average', formatNumber(totals.august)],
      ...(inProgress ? [[`Usually by ${SNAPSHOT.time}`, formatNumber(totals.byNow)]] : []),
      ['Cash recorded', formatMoney(totals.cash)],
      ['Personal bests', String(totals.bests)]
    ].forEach(([term, value]) => {
      const row = create('div');
      row.append(create('dt', '', term), create('dd', '', value));
      figures.append(row);
    });

    card.append(top, create('p', 'college-count', String(totals.count)), track, figures);
    holder.append(card);
  });
}

// Quick filters follow the same status label shown on each row
function progressGroup(figures) {
  if (!figures.count) return 'none';
  const tone = paceFor(figures, state.period).tone;
  if (tone === 'best' || tone === 'good') return 'ahead';
  return tone === 'info' ? 'track' : 'behind';
}

function filterLabels() {
  const finished = state.period === 'yesterday';
  return [
    ['all', 'Everyone'],
    ['ahead', finished ? 'Above August' : 'Ahead of pace'],
    ...(finished ? [] : [['track', 'On track']]),
    // Only a manager, or the person themselves, sees who is behind
    ...(isManager ? [
      ['behind', finished ? 'Below August' : 'Behind pace'],
      ['none', finished ? 'No registrations' : 'Not started yet']
    ] : [])
  ];
}

const COLUMNS = isManager ? 5 : 3;

document.getElementById('celebrate-make').hidden = !isManager;

const SORTS = {
  name: (row) => row.person.name,
  count: (row) => row.figures.count,
  pace: (row) => row.figures.count / Math.max(row.figures.byNow, 0.1),
  best: (row) => row.figures.previousBest,
  cash: (row) => row.figures.cash
};

function sortHeader(key, label, className = '') {
  const cell = create('th', className);
  cell.scope = 'col';
  const button = create('button', '', label);
  button.type = 'button';
  button.dataset.focus = `sort:${key}`;
  if (state.sortKey === key) {
    cell.setAttribute('aria-sort', state.sortDirection > 0 ? 'ascending' : 'descending');
    button.append(icon(state.sortDirection > 0 ? ICONS.up : ICONS.down, 14));
  }
  button.addEventListener('click', () => {
    if (state.sortKey === key) {
      state.sortDirection *= -1;
    } else {
      state.sortKey = key;
      state.sortDirection = key === 'name' ? 1 : -1;
    }
    keepFocus(showTable);
  });
  cell.append(button);
  return cell;
}

function registrationsCell(row, scale) {
  const { figures } = row;
  const cell = create('td', 'cell-registrations');
  const top = create('div', 'reg-top');
  top.append(create('b', '', String(figures.count)), create('span', '', `of ${formatNumber(figures.august)} August average`));

  const track = create('div', 'track track-small');
  const fill = create('span', 'track-fill');
  fill.style.width = `${Math.min(100, (figures.count / scale) * 100)}%`;
  track.append(fill);
  const markers = [['is-august', figures.august]];
  if (state.period !== 'yesterday') markers.push(['is-now', figures.byNow]);
  markers.forEach(([className, value]) => {
    const marker = create('span', `track-marker ${className}`);
    marker.style.left = `${Math.min(100, (value / scale) * 100)}%`;
    track.append(marker);
  });

  cell.append(top, track);
  return cell;
}

function personRow(row, scale, me, grouped) {
  const mine = row.person.name === me;
  const line = create('tr', mine ? 'is-me' : '');

  const nameCell = create('th', 'cell-name');
  nameCell.scope = 'row';
  if (isManager || mine) {
    const link = create('button', 'person-link', row.person.name);
    link.type = 'button';
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', () => showDetails(row));
    nameCell.append(link);
  } else {
    nameCell.append(create('b', '', row.person.name));
  }
  if (row.person.name === me) nameCell.append(create('span', 'you-tag', 'You'));
  // The college heading already names it when rows are grouped
  if (!grouped) nameCell.append(create('small', '', row.person.college));

  const statusCell = create('td', 'cell-status');
  const pace = paceFor(row.figures, state.period);
  if (isManager || mine || ['best', 'good', 'info'].includes(pace.tone)) statusCell.append(statusChip(pace));

  line.append(nameCell, registrationsCell(row, scale), statusCell);
  if (!isManager) return line;

  const bestCell = create('td', 'cell-best');
  bestCell.append(create('b', '', String(row.figures.previousBest)), create('small', '', `best ${PERIODS[state.period].unit}`));

  const cashCell = create('td', 'cell-cash');
  cashCell.append(create('b', '', `R${Math.round(row.figures.cash).toLocaleString('en-ZA')}`), create('small', '', 'cash'));

  line.append(bestCell, cashCell);
  return line;
}

function groupRow(label, rows) {
  const totals = totalsFor(rows);
  const line = create('tr', 'group-row');
  const cell = create('th', '');
  cell.colSpan = COLUMNS;
  cell.scope = 'rowgroup';
  cell.append(
    create('span', 'group-name', label),
    create('span', 'group-figures', `${totals.count} registrations · ${formatPercent(totals.count, totals.august)} of August average · ${rows.length} ${rows.length === 1 ? 'person' : 'people'}`)
  );
  line.append(cell);
  return line;
}

function showTable() {
  const session = readSession();
  const me = session.person || session.name;
  const search = state.search.trim().toLowerCase();
  const everyone = rowsFor(state.college);
  const searched = everyone.filter((row) => row.person.name.toLowerCase().includes(search));

  const counts = { all: searched.length, ahead: 0, track: 0, behind: 0, none: 0 };
  searched.forEach((row) => { counts[progressGroup(row.figures)] += 1; });
  buildSegmented(
    document.getElementById('results-filter'),
    filterLabels().map(([key, label]) => [key, `${label} ${counts[key]}`]),
    filterLabels().some(([key]) => key === state.filter) ? state.filter : 'all',
    (filter) => {
      state.filter = filter;
      showTable();
    }
  );

  if (!filterLabels().some(([key]) => key === state.filter)) state.filter = 'all';
  const rows = searched.filter((row) => state.filter === 'all' || progressGroup(row.figures) === state.filter);
  const sortValue = SORTS[state.sortKey] || SORTS.count;
  rows.sort((a, b) => {
    const first = sortValue(a);
    const second = sortValue(b);
    const order = typeof first === 'string' ? first.localeCompare(second) : first - second;
    return order * state.sortDirection || a.person.name.localeCompare(b.person.name);
  });

  // One scale for every bar, so bars can be compared down the list
  const scale = Math.max(1, ...everyone.map((row) => Math.max(row.figures.count, row.figures.august))) * 1.05;

  const sortChoice = document.getElementById('sort-select');
  const chosen = `${state.sortKey}:${state.sortDirection}`;
  sortChoice.value = [...sortChoice.options].some((option) => option.value === chosen) ? chosen : '';

  const table = document.getElementById('results');
  table.replaceChildren();

  const head = create('thead');
  const headRow = create('tr');
  headRow.append(
    sortHeader('name', 'Name', 'cell-name'),
    sortHeader('count', 'Registrations', 'cell-registrations'),
    sortHeader('pace', 'Status', 'cell-status'),
    ...(isManager ? [sortHeader('best', 'Best', 'cell-best'), sortHeader('cash', 'Cash', 'cell-cash')] : [])
  );
  head.append(headRow);
  table.append(head);

  if (!rows.length) {
    const body = create('tbody');
    const line = create('tr');
    const cell = create('td', 'is-empty', search ? `No one matches “${state.search.trim()}”.` : 'No one in this group right now.');
    cell.colSpan = COLUMNS;
    line.append(cell);
    body.append(line);
    table.append(body);
    return;
  }

  const grouped = state.group && state.college === 'All';
  const sections = grouped
    ? COLLEGES.map((college) => [college, rows.filter((row) => row.person.college === college)]).filter(([, list]) => list.length)
    : [[null, rows]];

  sections.forEach(([college, list]) => {
    const body = create('tbody');
    if (college) body.append(groupRow(college, list));
    list.forEach((row) => body.append(personRow(row, scale, me, Boolean(college))));
    table.append(body);
  });

  const totals = totalsFor(rows);
  const foot = create('tfoot');
  const line = create('tr');
  const label = create('th', 'cell-name', `Total · ${rows.length} ${rows.length === 1 ? 'person' : 'people'}`);
  label.scope = 'row';
  line.append(
    label,
    create('td', 'cell-registrations', `${totals.count} of ${formatNumber(totals.august)} August average`),
    create('td', 'cell-status', `${totals.bests} new best${totals.bests === 1 ? '' : 's'}`),
    ...(isManager ? [create('td', 'cell-best', ''), create('td', 'cell-cash', `R${Math.round(totals.cash).toLocaleString('en-ZA')}`)] : [])
  );
  foot.append(line);
  table.append(foot);
}

function showDetails(row) {
  const { person, figures } = row;
  const period = PERIODS[state.period];
  const dialog = document.getElementById('person-details');

  document.getElementById('details-name').textContent = person.name;
  document.getElementById('details-note').textContent = `${person.college} · ${period.note}`;

  const stats = document.getElementById('details-stats');
  stats.replaceChildren();
  [
    [String(figures.count), 'Registrations'],
    [formatNumber(figures.august), 'August average'],
    [String(figures.previousBest), `Best ${period.unit} since August`]
  ].forEach(([value, label]) => {
    const stat = create('div');
    stat.append(create('b', '', value), create('span', '', label));
    stats.append(stat);
  });

  document.getElementById('details-status').replaceChildren(statusChip(paceFor(figures, state.period)));
  const needed = figures.previousBest + 1 - figures.count;
  document.getElementById('details-next').textContent = needed > 0
    ? `${needed} more registration${needed === 1 ? '' : 's'} would set a new best ${period.unit} since August.`
    : `A new best ${period.unit} since August. Worth a celebration.`;

  const rows = [['Compared with August', describeChange(figures.count, figures.august)]];
  if (state.period !== 'yesterday') rows.push([`Usually by ${SNAPSHOT.time}`, formatNumber(figures.byNow)]);
  rows.push(
    ['Cash recorded', formatMoney(figures.cash)],
    ['Cash at August pace', formatMoney(figures.cashAugust)],
    ['Best cash day', person.cashBest ? formatMoney(person.cashBest) : 'None yet']
  );
  const list = document.getElementById('details-figures');
  list.replaceChildren();
  rows.forEach(([term, value]) => {
    const item = create('div');
    item.append(create('dt', '', term), create('dd', '', value));
    list.append(item);
  });

  const cardLink = document.getElementById('details-card');
  cardLink.hidden = !isManager;
  cardLink.textContent = `Make a card for ${person.name.split(' ')[0]}`;
  cardLink.onclick = () => remember('make-person', person.name);
  document.getElementById('details-progress').onclick = () => {
    remember('person', person.name);
    remember('period', state.period);
  };

  dialog.showModal();
}

// People with a new best this period, or the ones closest to one
function showCelebrateNext() {
  const rows = rowsFor(state.college);
  const unit = PERIODS[state.period].unit;
  const bests = rows.filter((row) => row.figures.count > row.figures.previousBest);
  const list = document.getElementById('celebrate-list');
  const note = document.getElementById('celebrate-note');
  list.replaceChildren();

  const shown = bests.length
    ? bests
    : rows.slice().sort((a, b) =>
      (a.figures.previousBest + 1 - a.figures.count) - (b.figures.previousBest + 1 - b.figures.count)).slice(0, 4);

  note.textContent = bests.length
    ? `New personal bests ${state.period === 'yesterday' ? 'yesterday' : 'in this period'}. Give these the biggest cheer.`
    : `No new records yet in this period. These people are closest to a new best ${unit}.`;

  shown.forEach((row) => {
    const needed = row.figures.previousBest + 1 - row.figures.count;
    const item = create('li');
    const who = create('div');
    const name = create('button', 'person-link', row.person.name);
    name.type = 'button';
    name.addEventListener('click', () => showDetails(row));
    who.append(name, create('small', '', `${row.person.college} · best ${unit} ${row.figures.previousBest}`));
    const now = create('div', 'now');
    now.append(
      create('b', '', String(row.figures.count)),
      statusChip(needed > 0 ? { tone: 'info', text: `${needed} to a new best` } : { tone: 'best', text: 'New best' })
    );
    item.append(create('span', 'avatar avatar-soft', initials(row.person.name)), who, now);
    list.append(item);
  });
}

function render() {
  showHeader();
  showTiles();
  showColleges();
  showTable();
  showCelebrateNext();
}

document.getElementById('college-select').addEventListener('change', (event) => {
  state.college = event.target.value;
  remember('team-college', state.college);
  render();
});

document.getElementById('close-details').addEventListener('click', () => document.getElementById('person-details').close());
document.getElementById('person-details').addEventListener('click', (event) => {
  if (event.target.id === 'person-details') event.target.close();
});
document.getElementById('thank-assist').addEventListener('click', () => remember('feedback-type', 'assist'));

document.getElementById('group-toggle').checked = state.group;
document.getElementById('group-toggle').addEventListener('change', (event) => {
  state.group = event.target.checked;
  remember('team-group', state.group ? 'on' : 'off');
  showTable();
});

// The column headings are hidden on phones, so they sort from a list instead
if (!isManager) {
  document.querySelectorAll('#sort-select option[value^="best"], #sort-select option[value^="cash"]')
    .forEach((option) => option.remove());
}

document.getElementById('sort-select').addEventListener('change', (event) => {
  const [key, direction] = event.target.value.split(':');
  state.sortKey = key;
  state.sortDirection = Number(direction);
  showTable();
});

document.getElementById('search').addEventListener('input', (event) => {
  state.search = event.target.value;
  showTable();
});

render();
