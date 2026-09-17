const PERIOD_OPTIONS = Object.entries(PERIODS).map(([key, period]) => [key, period.label]);

setUpShell();

const state = {
  period: PERIODS[recall('team-period')] ? recall('team-period') : 'today',
  college: recall('team-college') || 'All',
  search: '',
  sortKey: 'count',
  sortDirection: -1
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

const COLUMNS = [
  { key: 'name', label: 'Name', group: null, value: (row) => row.person.name },
  { key: 'college', label: 'College', group: null, value: (row) => row.person.college, text: true },
  { key: 'count', label: 'Total', group: 'Registrations', value: (row) => row.figures.count },
  { key: 'august', label: 'August', group: 'Registrations', value: (row) => row.figures.august, format: formatNumber },
  { key: 'byNow', label: `By ${SNAPSHOT.time}`, group: 'Registrations', value: (row) => row.figures.byNow, format: formatNumber, inProgressOnly: true },
  { key: 'change', label: 'Change', group: 'Registrations', value: (row) => row.figures.count - row.figures.august,
    format: (value, row) => describeChange(row.figures.count, row.figures.august) },
  { key: 'best', label: 'Best day', group: 'Registrations', value: (row) => row.person.best },
  { key: 'cash', label: 'Total', group: 'Cash recorded', value: (row) => row.figures.cash, format: formatMoney },
  { key: 'cashAugust', label: 'August', group: 'Cash recorded', value: (row) => row.figures.cashAugust, format: formatMoney },
  { key: 'cashChange', label: 'Change', group: 'Cash recorded', value: (row) => row.figures.cash - row.figures.cashAugust,
    format: (value) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatMoney(Math.abs(value))}` },
  { key: 'cashBest', label: 'Best day', group: 'Cash recorded', value: (row) => row.person.cashBest, format: formatMoney },
  { key: 'progress', label: 'Progress', group: null, value: (row) => row.figures.count / Math.max(row.figures.august, 0.1), text: true }
];

function visibleColumns() {
  return COLUMNS.filter((column) => !column.inProgressOnly || state.period !== 'yesterday');
}

function sortButton(column) {
  const cell = create('th', column.text || column.key === 'name' ? 'is-text' : '');
  cell.scope = 'col';
  const button = create('button', '', column.label);
  button.type = 'button';
  if (state.sortKey === column.key) {
    cell.setAttribute('aria-sort', state.sortDirection > 0 ? 'ascending' : 'descending');
    button.append(create('span', 'sort-arrow', state.sortDirection > 0 ? ' ↑' : ' ↓'));
  }
  button.addEventListener('click', () => {
    if (state.sortKey === column.key) {
      state.sortDirection *= -1;
    } else {
      state.sortKey = column.key;
      state.sortDirection = column.key === 'name' || column.key === 'college' ? 1 : -1;
    }
    showTable();
  });
  cell.append(button);
  return cell;
}

function showTable() {
  const columns = visibleColumns();
  const table = document.getElementById('results');
  table.replaceChildren();

  const head = create('thead');
  const groupRow = create('tr');
  const labelRow = create('tr');
  let index = 0;
  while (index < columns.length) {
    const column = columns[index];
    if (!column.group) {
      const cell = sortButton(column);
      cell.rowSpan = 2;
      groupRow.append(cell);
      index += 1;
      continue;
    }
    const span = columns.slice(index).findIndex((other) => other.group !== column.group);
    const size = span === -1 ? columns.length - index : span;
    const groupCell = create('th', 'is-group', column.group);
    groupCell.colSpan = size;
    groupCell.scope = 'colgroup';
    groupRow.append(groupCell);
    columns.slice(index, index + size).forEach((grouped) => labelRow.append(sortButton(grouped)));
    index += size;
  }
  head.append(groupRow, labelRow);

  const search = state.search.trim().toLowerCase();
  const rows = rowsFor(state.college).filter((row) => row.person.name.toLowerCase().includes(search));
  const sortColumn = COLUMNS.find((column) => column.key === state.sortKey) || COLUMNS[2];
  rows.sort((a, b) => {
    const first = sortColumn.value(a);
    const second = sortColumn.value(b);
    const order = typeof first === 'string' ? first.localeCompare(second) : first - second;
    return order * state.sortDirection || a.person.name.localeCompare(b.person.name);
  });

  const body = create('tbody');
  rows.forEach((row) => {
    const line = create('tr');
    columns.forEach((column) => {
      if (column.key === 'name') {
        const cell = create('th', 'is-text');
        cell.scope = 'row';
        const link = create('button', 'person-link', row.person.name);
        link.type = 'button';
        link.setAttribute('aria-haspopup', 'dialog');
        link.addEventListener('click', () => showDetails(row));
        cell.append(link);
        line.append(cell);
        return;
      }
      if (column.key === 'progress') {
        const cell = create('td', 'is-text');
        cell.append(statusChip(paceFor(row.figures, state.period)));
        line.append(cell);
        return;
      }
      const value = column.value(row);
      const cell = create('td', column.text ? 'is-text' : '', column.format ? column.format(value, row) : String(value));
      if (column.key === 'change' || column.key === 'cashChange') cell.classList.add(value >= 0 ? 'is-up' : 'is-down');
      line.append(cell);
    });
    body.append(line);
  });

  if (!rows.length) {
    const line = create('tr');
    const cell = create('td', 'is-empty', `No one matches "${state.search.trim()}".`);
    cell.colSpan = columns.length;
    line.append(cell);
    body.append(line);
  }

  const totals = totalsFor(rows);
  const foot = create('tfoot');
  const totalRow = create('tr');
  columns.forEach((column) => {
    const values = {
      name: `Total · ${rows.length} people`,
      count: String(totals.count),
      august: formatNumber(totals.august),
      byNow: formatNumber(totals.byNow),
      change: describeChange(totals.count, totals.august),
      cash: formatMoney(totals.cash),
      cashAugust: formatMoney(totals.cashAugust),
      cashChange: `${totals.cash - totals.cashAugust >= 0 ? '+' : '−'}${formatMoney(Math.abs(totals.cash - totals.cashAugust))}`,
      progress: `${totals.bests} new best${totals.bests === 1 ? '' : 's'}`
    };
    const cell = create(column.key === 'name' ? 'th' : 'td', column.text || column.key === 'name' ? 'is-text' : '', values[column.key] || '');
    if (column.key === 'name') cell.scope = 'row';
    totalRow.append(cell);
  });
  foot.append(totalRow);

  table.append(head, body, foot);
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
  rows.push(['Cash recorded', formatMoney(figures.cash)]);
  const list = document.getElementById('details-figures');
  list.replaceChildren();
  rows.forEach(([term, value]) => {
    const item = create('div');
    item.append(create('dt', '', term), create('dd', '', value));
    list.append(item);
  });

  const cardLink = document.getElementById('details-card');
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

document.getElementById('search').addEventListener('input', (event) => {
  state.search = event.target.value;
  showTable();
});

render();
