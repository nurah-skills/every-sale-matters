setUpShell();

const STATUSES = [
  ['ready', 'Ready'],
  ['changed', 'Figures changed'],
  ['sent', 'Sent'],
  ['skipped', 'Skipped'],
  ['all', 'All']
];

const STATUS_CHIPS = {
  ready: { tone: 'info', text: 'Ready' },
  changed: { tone: 'changed', text: 'Figures changed' },
  sent: { tone: 'good', text: 'Sent' },
  skipped: { tone: 'waiting', text: 'Skipped' }
};

const state = {
  status: STATUSES.some(([key]) => key === recall('cards-status')) ? recall('cards-status') : 'ready',
  person: recall('cards-person') || 'all',
  previewing: null
};

async function copyCaption(card) {
  if (await copyText(captionFor(card))) {
    showToast('Caption copied');
    return;
  }
  if (!document.getElementById('card-preview').open) await openPreview(card);
  document.getElementById('preview-caption').select();
  showToast('Copying was blocked. The caption is selected so you can copy it yourself.');
}

async function openPreview(card) {
  state.previewing = card;
  const dialog = document.getElementById('card-preview');
  const image = document.getElementById('preview-image');
  document.getElementById('preview-title').textContent = `${card.person} · ${card.lead.title}`;
  document.getElementById('preview-caption').value = captionFor(card);
  image.alt = `${card.lead.title} card for ${card.person}`;
  image.removeAttribute('src');
  if (!dialog.open) dialog.showModal();
  image.src = (await drawCard(card)).toDataURL('image/png');
}

function setStatus(card, status) {
  saveCardStatus(card.id, status);
  showReadyCount();
  render();
  const messages = { sent: 'Marked as sent', skipped: 'Skipped', ready: 'Moved back to ready' };
  showToast(messages[status]);
}

function actionButton(label, className, onClick) {
  const button = create('button', `button button-inline ${className}`, label);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}

function cardTile(card) {
  const tile = create('article', 'card-tile');

  const art = create('div', `card-art kind-${card.lead.kind}`);
  const pill = create('span', 'card-pill', pillText(card));
  pill.style.background = pillColour(card);
  art.append(pill, create('b', '', shortValueText(card.lead)), create('span', '', card.lead.unit));

  const details = create('div', 'card-details');
  const top = create('div', 'card-top');
  top.append(create('h3', '', card.person), statusChip(STATUS_CHIPS[card.status]));
  details.append(
    top,
    create('p', 'card-title', card.lead.title),
    create('p', 'card-detail', card.lead.detail)
  );
  if (card.also.length) details.append(create('p', 'card-also', `Also: ${card.also.join(' · ')}`));
  details.append(create('p', 'card-meta', `${card.college} · ${card.date} · figures read ${card.read}`));

  const share = create('div', 'card-actions');
  share.append(
    actionButton('Download PNG', '', () => downloadCard(card)),
    actionButton('Preview', 'button-secondary', () => openPreview(card)),
    actionButton('Copy caption', 'button-secondary', () => copyCaption(card))
  );

  const manage = create('div', 'card-manage');
  if (card.status === 'ready' || card.status === 'changed') {
    manage.append(
      actionButton(card.status === 'changed' ? 'Checked, mark as sent' : 'Mark as sent', 'button-quiet', () => setStatus(card, 'sent')),
      actionButton('Skip', 'button-quiet', () => setStatus(card, 'skipped'))
    );
  } else {
    manage.append(actionButton('Move back to ready', 'button-quiet', () => setStatus(card, 'ready')));
  }

  details.append(share, manage);
  tile.append(art, details);
  return tile;
}

function render() {
  const cards = cardsWithStatus();
  const ready = cards.filter((card) => card.status === 'ready');
  const bests = ready.filter((card) => card.lead.kind === 'best').length;

  document.getElementById('snapshot-time').textContent = SNAPSHOT.time;
  document.getElementById('cards-note').textContent =
    `${ready.length} card${ready.length === 1 ? '' : 's'} ready${bests ? `, including ${bests} personal best${bests === 1 ? '' : 's'}` : ''}. Personal bests come first.`;

  const counts = (key) => (key === 'all' ? cards.length : cards.filter((card) => card.status === key).length);
  buildSegmented(
    document.getElementById('status-picker'),
    STATUSES.map(([key, label]) => [key, `${label} ${counts(key)}`]),
    state.status,
    (status) => {
      state.status = status;
      remember('cards-status', status);
      render();
    }
  );

  const people = [...new Set(cards.map((card) => card.person))].sort();
  if (state.person !== 'all' && !people.includes(state.person)) state.person = 'all';
  const filter = document.getElementById('person-filter');
  filter.replaceChildren(new Option('Everyone', 'all'), ...people.map((name) => new Option(name, name)));
  filter.value = state.person;

  const shown = cards.filter((card) =>
    (state.status === 'all' || card.status === state.status) && (state.person === 'all' || card.person === state.person));

  const grid = document.getElementById('card-grid');
  grid.replaceChildren();
  if (!shown.length) {
    const label = STATUSES.find(([key]) => key === state.status)[1].toLowerCase();
    grid.append(create('p', 'empty', state.status === 'all' ? 'No cards for this person yet.' : `No ${label} cards here right now.`));
    return;
  }
  shown.forEach((card) => grid.append(cardTile(card)));
}

document.getElementById('person-filter').addEventListener('change', (event) => {
  state.person = event.target.value;
  remember('cards-person', state.person);
  render();
});

document.getElementById('check-cards').addEventListener('click', () => {
  showToast(`You're up to date. These cards use the ${SNAPSHOT.time} figures.`);
});

document.getElementById('close-preview').addEventListener('click', () => document.getElementById('card-preview').close());
document.getElementById('preview-download').addEventListener('click', () => state.previewing && downloadCard(state.previewing));
document.getElementById('preview-copy').addEventListener('click', () => state.previewing && copyCaption(state.previewing));
document.getElementById('card-preview').addEventListener('click', (event) => {
  if (event.target.id === 'card-preview') event.target.close();
});

render();
